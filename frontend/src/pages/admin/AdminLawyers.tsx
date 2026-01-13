import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import adminApi, { clearAdminCache } from '../../services/adminApi';
interface Lawyer {
  id: number;
  name: string;
  email: string;
  specialization: string;
  status: string;
  is_available: boolean;
  consultation_fee: number;
  total_appointments: number;
  created_at: string;
}

const AdminLawyers: React.FC = () => {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [notificationLawyerName, setNotificationLawyerName] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'suspend' | 'activate';
    lawyerId: number;
    lawyerName: string;
    currentStatus: string;
  } | null>(null);

  // Lock body scroll when modal is open and prevent layout shift
  useEffect(() => {
    const header = document.getElementById('admin-header');
    if (showConfirmModal || showNotificationModal) {
      // Get scrollbar width before hiding it
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      if (header) header.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      if (header) header.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      if (header) header.style.paddingRight = '';
    };
  }, [showConfirmModal, showNotificationModal]);

  useEffect(() => {
    loadLawyers();
  }, []);

  const loadLawyers = async () => {
    try {
      const response = await adminApi.get('/lawyers');
      setLawyers(response.data.lawyers || response.data || []);
    } catch (error) {
      console.error('Error loading lawyers:', error);
      setLawyers([]);
    } finally {
      setLoading(false);
    }
  };

 const toggleAvailability = async (lawyerId: number, currentStatus: boolean, lawyerName: string) => {
  try {
    await adminApi.patch(`/lawyers/${lawyerId}/availability`, {
      is_available: !currentStatus
    });
    clearAdminCache(); // Clear frontend cache
    setNotificationLawyerName(lawyerName);
    setNotificationMessage(`Lawyer availability updated to ${!currentStatus ? 'Online' : 'Offline'}`);
    setNotificationType('success');
    setShowNotificationModal(true);
    loadLawyers(); // Reload the list
  } catch (error) {
    console.error('Error toggling availability:', error);
    setNotificationMessage('Failed to update lawyer availability');
    setNotificationType('error');
    setShowNotificationModal(true);
  }
};

const showConfirmationModal = (lawyerId: number, currentStatus: string, lawyerName: string) => {
  // Only allow suspending/activating lawyers (approval is done in Verifications page)
  if (currentStatus !== 'approved' && currentStatus !== 'suspended') {
    setNotificationMessage('Please use the Verifications page to approve pending lawyers');
    setNotificationType('error');
    setShowNotificationModal(true);
    return;
  }

  const actionType = currentStatus === 'approved' ? 'suspend' : 'activate';
  setConfirmAction({
    type: actionType,
    lawyerId,
    lawyerName,
    currentStatus
  });
  setShowConfirmModal(true);
};

const confirmToggleStatus = async () => {
  if (!confirmAction) return;

  const newStatus = confirmAction.currentStatus === 'approved' ? 'suspended' : 'approved';
  const action = confirmAction.currentStatus === 'approved' ? 'suspended' : 'activated';

  try {
    await adminApi.patch(`/lawyers/${confirmAction.lawyerId}/status`, {
      status: newStatus
    });
    clearAdminCache(); // Clear frontend cache
    setNotificationLawyerName(confirmAction.lawyerName);
    setNotificationMessage(`Lawyer ${action} successfully`);
    setNotificationType('success');
    setShowConfirmModal(false);
    setShowNotificationModal(true);
    setConfirmAction(null);
    loadLawyers(); // Reload the list
  } catch (error) {
    console.error(`Error ${action}ing lawyer:`, error);
    setNotificationMessage(`Failed to ${action === 'suspended' ? 'suspend' : 'activate'} lawyer`);
    setNotificationType('error');
    setShowConfirmModal(false);
    setShowNotificationModal(true);
    setConfirmAction(null);
  }
};

  // Filter lawyers - ADD NULL CHECKS HERE
  const filteredLawyers = (lawyers || []).filter(lawyer => {
    const matchesStatus = filterStatus === 'all' || lawyer.status === filterStatus;
    const matchesSearch =
      (lawyer.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lawyer.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lawyer.specialization || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div>
          <div className="h-9 bg-gray-200 rounded w-56 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-12"></div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-8 bg-green-100 rounded w-12"></div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-8 bg-yellow-100 rounded w-12"></div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="h-4 bg-gray-200 rounded w-28 mb-2"></div>
            <div className="h-8 bg-blue-100 rounded w-12"></div>
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex gap-4">
            <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
            <div className="w-40 h-10 bg-gray-200 rounded-lg"></div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-40"></div>
                    <div className="h-3 bg-gray-100 rounded w-56"></div>
                    <div className="flex gap-2">
                      <div className="h-5 bg-gray-100 rounded w-20"></div>
                      <div className="h-5 bg-gray-100 rounded w-24"></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-7 bg-green-100 rounded-full w-20"></div>
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
    <div className="space-y-3">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-0.5">Lawyers Management</h1>
        <p className="text-xs sm:text-sm text-gray-600">Manage all lawyers on the platform</p>
      </div>

      {/* Stats Summary - Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
        <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium">Total Lawyers</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5">{(lawyers || []).length}</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium">Verified</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5">
                {(lawyers || []).filter(l => l.status === 'approved').length}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium">Pending</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5">
                {(lawyers || []).filter(l => l.status === 'pending').length}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium">Rejected</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5">
                {(lawyers || []).filter(l => l.status === 'rejected').length}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium">Available Now</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5">
                {(lawyers || []).filter(l => l.status === 'approved' && l.is_available).length}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-2 sm:p-3 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="flex-1 relative">
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search lawyers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all sm:min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="approved">Verified</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Lawyers Table - Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse">
            <colgroup>
              <col style={{ width: '20%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '18%' }} />
            </colgroup>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-r border-transparent">
                  Lawyer
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-r border-transparent">
                  Specialization
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-r border-transparent">
                  Fee
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-r border-transparent">
                  Appointments
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-r border-transparent">
                  Status
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-r border-transparent">
                  Availability
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLawyers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                    No lawyers found
                  </td>
                </tr>
              ) : (
                filteredLawyers.map((lawyer) => (
                  <tr key={lawyer.id} className="hover:bg-gray-50 transition">
                    <td className="px-3 py-3 border-r border-transparent">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-xs">
                            {lawyer.name?.charAt(0) || 'L'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{lawyer.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-600 truncate">{lawyer.email || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 border-r border-transparent">
                      <span className="text-xs text-gray-700 block leading-relaxed" title={lawyer.specialization || 'N/A'}>
                        {lawyer.specialization || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-r border-transparent">
                      <span className="text-sm text-gray-900 font-medium whitespace-nowrap">
                        ₱{lawyer.consultation_fee ? lawyer.consultation_fee.toLocaleString() : '0'}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-r border-transparent">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium whitespace-nowrap">
                        {lawyer.total_appointments || 0} bookings
                      </span>
                    </td>
                    <td className="px-3 py-3 border-r border-transparent">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        lawyer.status === 'approved' ? 'bg-green-100 text-green-700' :
                        lawyer.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {lawyer.status === 'approved' ? 'verified' : lawyer.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-r border-transparent">
                      {lawyer.status === 'approved' ? (
                        <button
                          onClick={() => toggleAvailability(lawyer.id, lawyer.is_available, lawyer.name)}
                          className={`px-2 py-1 rounded-full text-xs font-medium transition whitespace-nowrap ${
                            lawyer.is_available
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {lawyer.is_available ? 'Online' : 'Offline'}
                        </button>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-400 whitespace-nowrap">
                          N/A
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-sm">
                      {lawyer.status === 'approved' ? (
                        <button
                          onClick={() => showConfirmationModal(lawyer.id, lawyer.status, lawyer.name)}
                          className="px-4 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition whitespace-nowrap"
                        >
                          Suspend
                        </button>
                      ) : lawyer.status === 'suspended' ? (
                        <button
                          onClick={() => showConfirmationModal(lawyer.id, lawyer.status, lawyer.name)}
                          className="px-4 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-medium hover:bg-green-100 transition whitespace-nowrap"
                        >
                          Activate
                        </button>
                      ) : (
                        <span className="inline-block text-center px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-xs whitespace-nowrap">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lawyers Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {filteredLawyers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <p className="text-gray-500 text-sm">No lawyers found</p>
          </div>
        ) : (
          filteredLawyers.map((lawyer) => (
            <div key={lawyer.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              {/* Header with Lawyer Info and Status */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      {lawyer.name?.charAt(0) || 'L'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{lawyer.name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500 truncate">{lawyer.email || 'N/A'}</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                  lawyer.status === 'approved' ? 'bg-green-100 text-green-700' :
                  lawyer.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {lawyer.status === 'approved' ? 'verified' : lawyer.status || 'unknown'}
                </span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Specialization</div>
                  <div className="text-gray-900 text-xs font-medium truncate">{lawyer.specialization || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Fee</div>
                  <div className="text-gray-900 text-xs font-medium">
                    ₱{lawyer.consultation_fee ? lawyer.consultation_fee.toLocaleString() : '0'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Appointments</div>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {lawyer.total_appointments || 0} bookings
                  </span>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Availability</div>
                  {lawyer.status === 'approved' ? (
                    <button
                      onClick={() => toggleAvailability(lawyer.id, lawyer.is_available, lawyer.name)}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium transition ${
                        lawyer.is_available
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {lawyer.is_available ? 'Online' : 'Offline'}
                    </button>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400">N/A</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-gray-100 flex justify-end">
                {lawyer.status === 'approved' ? (
                  <button
                    onClick={() => showConfirmationModal(lawyer.id, lawyer.status, lawyer.name)}
                    className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition"
                  >
                    Suspend
                  </button>
                ) : lawyer.status === 'suspended' ? (
                  <button
                    onClick={() => showConfirmationModal(lawyer.id, lawyer.status, lawyer.name)}
                    className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-medium hover:bg-green-100 transition"
                  >
                    Activate
                  </button>
                ) : (
                  <span className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-xs">
                    Pending Verification
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Results Count */}
      <div className="text-center text-gray-600 text-xs sm:text-sm">
        Showing {filteredLawyers.length} of {(lawyers || []).length} lawyers
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && createPortal(
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div className="bg-white rounded-lg max-w-md w-full mx-4 shadow-xl">
              <div className="p-6">
                {/* Warning Icon */}
                <div className="flex justify-center mb-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    confirmAction.type === 'suspend' ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    <svg className={`w-8 h-8 ${
                      confirmAction.type === 'suspend' ? 'text-red-600' : 'text-green-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h3 className={`text-xl font-bold text-center mb-2 ${
                confirmAction.type === 'suspend' ? 'text-red-900' : 'text-green-900'
              }`}>
                Confirm {confirmAction.type === 'suspend' ? 'Suspension' : 'Activation'}
              </h3>

              {/* Message */}
              <p className="text-gray-700 text-center mb-2">
                Are you sure you want to {confirmAction.type} this lawyer?
              </p>

              {/* Lawyer Name */}
              <p className="text-gray-900 font-semibold text-center mb-6">
                {confirmAction.lawyerName}
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                  }}
                  className="flex-1 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmToggleStatus}
                  className={`flex-1 px-6 py-2 rounded-lg font-medium transition ${
                    confirmAction.type === 'suspend'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {confirmAction.type === 'suspend' ? 'Suspend' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.getElementById('modal-root') || document.body
      )}

      {/* Notification Modal */}
      {showNotificationModal && createPortal(
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div className="bg-white rounded-lg max-w-md w-full mx-4 shadow-xl">
            <div className="p-6">
              {/* Icon */}
              <div className="flex justify-center mb-4">
                {notificationType === 'success' ? (
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Title */}
              <h3 className={`text-xl font-bold text-center mb-2 ${
                notificationType === 'success' ? 'text-green-900' : 'text-red-900'
              }`}>
                {notificationType === 'success' ? 'Success!' : 'Error'}
              </h3>

              {/* Message */}
              <p className="text-gray-700 text-center mb-2">
                {notificationMessage}
              </p>

              {/* Lawyer Name */}
              {notificationLawyerName && (
                <p className="text-gray-900 font-semibold text-center mb-4">
                  {notificationLawyerName}
                </p>
              )}

              {/* Close Button */}
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => {
                    setShowNotificationModal(false);
                    setNotificationLawyerName('');
                  }}
                  className={`px-6 py-2 rounded-lg font-medium transition ${
                    notificationType === 'success'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminLawyers;