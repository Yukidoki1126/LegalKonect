import React, { useEffect, useState } from 'react';
import adminApi, { clearAdminCache } from '../../services/adminApi';
import ConfirmModal from '../../components/ConfirmModal'; 
import Toast from '../../components/Toast';
import PageTransition from '../../components/PageTransition';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  user_type: string;
  is_lawyer: boolean;
  // optional fields returned from some endpoints
  first_name?: string;
  last_name?: string;
  lawyer?: {
    first_name?: string;
    last_name?: string;
  };
  total_appointments: number;
  created_at: string;
  status?: string;
}

interface PaginatedResponse {
  data: User[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  });
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<{
    id: number;
    name: string;
    email: string;
    type: string;
    appointments: number;
  } | null>(null);
  
  // Add toast state
  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({
    isOpen: false,
    message: '',
    type: 'success'
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setToast({ isOpen: true, message, type });
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    loadUsers();
  }, [pagination.currentPage]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.get(`/users?page=${pagination.currentPage}`);
      let usersData: User[] = response.data.data || response.data || [];

      // Try to fetch lawyers and merge names where user.name is empty or stale.
      try {
        const lawyersResp = await adminApi.get('/lawyers');
        const lawyersList = lawyersResp.data.lawyers || lawyersResp.data || [];
        // build map by email for a best-effort merge
        const lawyerByEmail = new Map<string, any>();
        lawyersList.forEach((l: any) => {
          if (l.email) lawyerByEmail.set(l.email.toLowerCase(), l);
        });

        usersData = usersData.map(u => {
          if ((!u.name || u.name.trim() === '') && u.email) {
            const match = lawyerByEmail.get(u.email.toLowerCase());
            if (match) {
              return { ...u, lawyer: { first_name: match.first_name || (match.name ? match.name.split(' ')[0] : ''), last_name: match.last_name || (match.name ? match.name.split(' ').slice(1).join(' ') : '') } };
            }
          }
          // still include matched lawyer details even when user.name exists to keep display consistent
          const matched = lawyerByEmail.get(u.email?.toLowerCase?.() || '');
          if (matched) {
            return { ...u, lawyer: { first_name: matched.first_name || (matched.name ? matched.name.split(' ')[0] : ''), last_name: matched.last_name || (matched.name ? matched.name.split(' ').slice(1).join(' ') : '') } };
          }
          return u;
        });
      } catch (e) {
        // ignore lawyer fetch errors — users will still render normally
        console.warn('Could not fetch lawyers for user name merge', e);
      }

      setUsers(usersData);
      setPagination({
        currentPage: response.data.current_page || 1,
        lastPage: response.data.last_page || 1,
        total: response.data.total || 0,
      });
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
      showToast('Failed to load users. Please refresh the page.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const suspendUser = async (userId: number, userName: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    setSelectedUser({
      id: userId,
      name: userName,
      email: user.email,
      type: user.is_lawyer ? 'Lawyer' : 'Client',
      appointments: user.total_appointments
    });
    setShowConfirmModal(true);
  };

  const handleConfirmSuspend = async () => {
    if (!selectedUser) return;

    try {
      await adminApi.patch(`/users/${selectedUser.id}/suspend`);
      clearAdminCache();
      loadUsers();
      setShowConfirmModal(false);
      showToast(`${selectedUser.name} has been suspended successfully`, 'success');
      setSelectedUser(null);
    } catch (error) {
      console.error('Error suspending user:', error);
      showToast('Failed to suspend user. Please try again.', 'error');
    }
  };

  const handleCancelSuspend = () => {
    setShowConfirmModal(false);
    setSelectedUser(null);
  };

  const activateUser = async (userId: number, userName: string) => {
    try {
      await adminApi.patch(`/users/${userId}/activate`);
      clearAdminCache();
      loadUsers();
      showToast(`${userName} has been activated successfully`, 'success');
    } catch (error) {
      console.error('Error activating user:', error);
      showToast('Failed to activate user. Please try again.', 'error');
    }
  };

  const deleteUser = async (userId: number, userName: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    setSelectedUser({
      id: userId,
      name: userName,
      email: user.email,
      type: user.is_lawyer ? 'Lawyer' : 'Client',
      appointments: user.total_appointments
    });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    try {
      await adminApi.delete(`/users/${selectedUser.id}`);
      clearAdminCache();
      loadUsers();
      setShowDeleteModal(false);
      showToast(`${selectedUser.name} has been permanently deleted`, 'success');
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete user. They may have existing appointments.';
      showToast(errorMessage, 'error');
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  // Filter users
  const getDisplayName = (user: User) => {
    // Prefer explicit user.name, then fallbacks to first/last or nested lawyer fields
    if (user.name && user.name.trim()) return user.name;
    const first = user.first_name || user.lawyer?.first_name || '';
    const last = user.last_name || user.lawyer?.last_name || '';
    const combined = `${first} ${last}`.trim();
    return combined || 'Unknown';
  };

  const filteredUsers = (users || []).filter(user => {
    const matchesType =
      filterType === 'all' ||
      (filterType === 'clients' && !user.is_lawyer) ||
      (filterType === 'lawyers' && user.is_lawyer);

    const displayName = getDisplayName(user).toLowerCase();
    const matchesSearch =
      displayName.includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phone || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div>
          <div className="h-9 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="h-4 bg-gray-200 rounded w-28 mb-2"></div>
            <div className="h-8 bg-blue-100 rounded w-16"></div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-8 bg-green-100 rounded w-16"></div>
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex gap-4">
            <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
            <div className="w-40 h-10 bg-gray-200 rounded-lg"></div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-36"></div>
                    <div className="h-3 bg-gray-100 rounded w-48"></div>
                    <div className="h-3 bg-gray-100 rounded w-28"></div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-6 bg-blue-100 rounded-full w-16"></div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Users Management</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage all platform users and clients</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm font-medium">Total Users</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1">{pagination.total}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded-lg sm:rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm font-medium">Clients Only</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1">
                {users.filter(u => !u.is_lawyer).length}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg sm:rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm font-medium">Lawyer Accounts</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1">
                {users.filter(u => u.is_lawyer).length}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 rounded-lg sm:rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-3 sm:p-5 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 sm:left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm sm:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all sm:min-w-[160px]"
          >
            <option value="all">All Users</option>
            <option value="clients">Clients Only</option>
            <option value="lawyers">Lawyers Only</option>
          </select>
        </div>
      </div>

      {/* Users Table - Desktop */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Appointments
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-600">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {getDisplayName(user).charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {getDisplayName(user)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {user.email || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">
                        {user.phone || 'No phone'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {user.is_lawyer ? (
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            Lawyer
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            Client
                          </span>
                        )}
                        {user.status === 'suspended' && (
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            Suspended
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 font-medium">
                        {user.total_appointments || 0} bookings
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        {user.status === 'suspended' ? (
                          <button
                            onClick={() => activateUser(user.id, getDisplayName(user))}
                            className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg font-medium transition text-xs"
                          >
                            Activate
                          </button>
                        ) : (
                          <button
                            onClick={() => suspendUser(user.id, getDisplayName(user))}
                            className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium transition text-xs"
                          >
                            Suspend
                          </button>
                        )}
                        <button
                          onClick={() => deleteUser(user.id, getDisplayName(user))}
                          className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium transition text-xs"
                          title="Permanently Delete"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center text-gray-600 border border-gray-200">
            No users found
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              {/* User Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      {getDisplayName(user).charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{getDisplayName(user)}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.is_lawyer ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {user.is_lawyer ? 'Lawyer' : 'Client'}
                  </span>
                  {user.status === 'suspended' && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                      Suspended
                    </span>
                  )}
                </div>
              </div>

              {/* User Details */}
              <div className="grid grid-cols-2 gap-2 text-sm mb-3 py-3 border-t border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-gray-900 font-medium truncate">{user.phone || 'No phone'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Bookings</p>
                  <p className="text-gray-900 font-medium">{user.total_appointments || 0}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <div className="flex gap-2">
                  {user.status === 'suspended' ? (
                    <button
                      onClick={() => activateUser(user.id, getDisplayName(user))}
                      className="px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg font-medium transition text-xs"
                    >
                      Activate
                    </button>
                  ) : (
                    <button
                      onClick={() => suspendUser(user.id, getDisplayName(user))}
                      className="px-3 py-1.5 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg font-medium transition text-xs"
                    >
                      Suspend
                    </button>
                  )}
                  <button
                    onClick={() => deleteUser(user.id, getDisplayName(user))}
                    className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium transition text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.lastPage > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm">
          <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
            Page {pagination.currentPage} of {pagination.lastPage} ({pagination.total} total)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
              disabled={pagination.currentPage === 1}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-gray-300 text-gray-900 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
              disabled={pagination.currentPage === pagination.lastPage}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="text-center text-gray-600 text-xs sm:text-sm">
        Showing {filteredUsers.length} users
      </div>

      {/* Suspend Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title="Suspend User"
        message="This user will not be able to access the platform until reactivated by an administrator."
        confirmText="Yes, Suspend"
        cancelText="Cancel"
        onConfirm={handleConfirmSuspend}
        onCancel={handleCancelSuspend}
        type="danger"
        requireCountdown={true}
        countdownSeconds={5}
        userDetails={selectedUser ? {
          name: selectedUser.name,
          email: selectedUser.email,
          type: selectedUser.type,
          appointments: selectedUser.appointments
        } : undefined}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="⚠️ Permanently Delete User"
        message="This action CANNOT be undone. The user and all their data will be permanently removed from the system."
        confirmText="Yes, Delete Forever"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        type="danger"
        requireCountdown={true}
        countdownSeconds={10}
        userDetails={selectedUser ? {
          name: selectedUser.name,
          email: selectedUser.email,
          type: selectedUser.type,
          appointments: selectedUser.appointments
        } : undefined}
      />

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isOpen={toast.isOpen}
        onClose={closeToast}
      />
    </div>
    </PageTransition>
  );
};

export default AdminUsers;