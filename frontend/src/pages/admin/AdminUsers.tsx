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
      setUsers(response.data.data || response.data || []);
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
  const filteredUsers = (users || []).filter(user => {
    const matchesType =
      filterType === 'all' ||
      (filterType === 'clients' && !user.is_lawyer) ||
      (filterType === 'lawyers' && user.is_lawyer);

    const matchesSearch =
      (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phone || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div>
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>

        {/* Filters Skeleton */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex gap-4">
            <div className="flex-1 h-10 bg-gray-200 rounded"></div>
            <div className="w-40 h-10 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Users Management</h1>
        <p className="text-gray-600">Manage all platform users and clients</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <p className="text-gray-600 text-sm">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <p className="text-gray-600 text-sm">Clients Only</p>
          <p className="text-2xl font-bold text-blue-600">
            {users.filter(u => !u.is_lawyer).length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <p className="text-gray-600 text-sm">Lawyer Accounts</p>
          <p className="text-2xl font-bold text-blue-600">
            {users.filter(u => u.is_lawyer).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Users</option>
            <option value="clients">Clients Only</option>
            <option value="lawyers">Lawyers Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
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
                            {user.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || 'Unknown'}
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
                            onClick={() => activateUser(user.id, user.name)}
                            className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg font-medium transition text-xs"
                          >
                            Activate
                          </button>
                        ) : (
                          <button
                            onClick={() => suspendUser(user.id, user.name)}
                            className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium transition text-xs"
                          >
                            Suspend
                          </button>
                        )}
                        <button
                          onClick={() => deleteUser(user.id, user.name)}
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

      {/* Pagination */}
      {pagination.lastPage > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-600">
            Showing page {pagination.currentPage} of {pagination.lastPage} ({pagination.total} total)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
              disabled={pagination.currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
              disabled={pagination.currentPage === pagination.lastPage}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="text-center text-gray-600 text-sm">
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