import React, { useEffect, useState } from 'react';
import adminApi, { clearAdminCache } from '../../services/adminApi';
import PageTransition from '../../components/PageTransition';
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
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>

        {/* Filters Skeleton */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex gap-4">
            <div className="flex-1 h-10 bg-gray-200 rounded"></div>
            <div className="w-40 h-10 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-24"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lawyers Management</h1>
        <p className="text-gray-600">Manage all lawyers on the platform</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-gray-600 text-sm">Total Lawyers</p>
          <p className="text-2xl font-bold text-gray-900">{(lawyers || []).length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-gray-600 text-sm">Approved</p>
          <p className="text-2xl font-bold text-green-600">
            {(lawyers || []).filter(l => l.status === 'approved').length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-gray-600 text-sm">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {(lawyers || []).filter(l => l.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-gray-600 text-sm">Available Now</p>
          <p className="text-2xl font-bold text-blue-600">
            {(lawyers || []).filter(l => l.is_available).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Lawyers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Lawyer
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Specialization
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Fee
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Appointments
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Availability
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLawyers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No lawyers found
                  </td>
                </tr>
              ) : (
                filteredLawyers.map((lawyer) => (
                  <tr key={lawyer.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {lawyer.name?.charAt(0) || 'L'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{lawyer.name || 'Unknown'}</div>
                          <div className="text-sm text-gray-600">{lawyer.email || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{lawyer.specialization || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 font-medium">
                        ₱{lawyer.consultation_fee ? lawyer.consultation_fee.toLocaleString() : '0'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {lawyer.total_appointments || 0} bookings
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        lawyer.status === 'approved' ? 'bg-green-100 text-green-700' :
                        lawyer.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {lawyer.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleAvailability(lawyer.id, lawyer.is_available, lawyer.name)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                          lawyer.is_available
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {lawyer.is_available ? 'Online' : 'Offline'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {lawyer.status === 'approved' ? (
                        <button
                          onClick={() => showConfirmationModal(lawyer.id, lawyer.status, lawyer.name)}
                          className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition"
                        >
                          Suspend
                        </button>
                      ) : lawyer.status === 'suspended' ? (
                        <button
                          onClick={() => showConfirmationModal(lawyer.id, lawyer.status, lawyer.name)}
                          className="px-4 py-2 bg-green-50 text-green-600 rounded-lg font-medium hover:bg-green-100 transition"
                        >
                          Activate
                        </button>
                      ) : (
                        <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm">
                          Pending Verification
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

      {/* Results Count */}
      <div className="text-center text-gray-600 text-sm">
        Showing {filteredLawyers.length} of {(lawyers || []).length} lawyers
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
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
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
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
        </div>
      )}
    </div>
    </PageTransition>
  );
};

export default AdminLawyers;