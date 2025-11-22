import React, { useEffect, useState } from 'react';
import adminApi from '../../services/adminApi';
import PageTransition from '../../components/PageTransition';

interface Lawyer {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  license_number: string;
  years_experience: number;
  office_address: string;
  office_phone?: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  status: 'pending' | 'approved' | 'rejected';
  ibp_number: string;
  roll_of_attorneys_number?: string;
  prc_license_number?: string;
  verification_documents: Record<string, string>;
  created_at: string;
  verified_at?: string;
  verification_notes?: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  specializations?: Array<{
    id: number;
    name: string;
  }>;
  verified_by?: {
    id: number;
    name: string;
  };
}

const AdminVerifications: React.FC = () => {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [documentUrls, setDocumentUrls] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [approveNotes, setApproveNotes] = useState('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [notificationLawyerName, setNotificationLawyerName] = useState('');

  useEffect(() => {
    loadLawyers();
  }, [filterStatus]);

  const loadLawyers = async () => {
    try {
      setLoading(true);
      let response;

      if (filterStatus === 'pending') {
        response = await adminApi.get('/verifications/pending');
      } else {
        response = await adminApi.get(`/verifications/lawyers?status=${filterStatus}`);
      }

      setLawyers(response.data.lawyers || []);
    } catch (error) {
      console.error('Error loading lawyers:', error);
      setLawyers([]);
    } finally {
      setLoading(false);
    }
  };

  const viewLawyerDetails = async (lawyer: Lawyer) => {
    try {
      const response = await adminApi.get(`/verifications/lawyers/${lawyer.id}`);
      setSelectedLawyer(response.data.lawyer);
      setDocumentUrls(response.data.document_urls || {});
      setShowDetailModal(true);
      setRejectNotes('');
      setApproveNotes('');
    } catch (error) {
      console.error('Error loading lawyer details:', error);
      alert('Failed to load lawyer details');
    }
  };

  const handleApproveLawyer = async () => {
    if (!selectedLawyer) return;

    try {
      setActionLoading(true);
      await adminApi.post(`/verifications/lawyers/${selectedLawyer.id}/approve`, {
        notes: approveNotes || undefined
      });

      const lawyerName = `${selectedLawyer.first_name} ${selectedLawyer.last_name}`;
      setNotificationLawyerName(lawyerName);
      setNotificationMessage('Lawyer verified and approved successfully!');
      setNotificationType('success');
      setShowDetailModal(false);
      setShowNotificationModal(true);
      setSelectedLawyer(null);
      loadLawyers();
    } catch (error) {
      console.error('Error approving lawyer:', error);
      setNotificationMessage('Failed to approve lawyer. Please try again.');
      setNotificationType('error');
      setShowNotificationModal(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectLawyer = async () => {
    if (!selectedLawyer) return;

    if (!rejectNotes || rejectNotes.trim().length < 10) {
      setNotificationMessage('Please provide a rejection reason (minimum 10 characters)');
      setNotificationType('error');
      setShowNotificationModal(true);
      return;
    }

    try {
      setActionLoading(true);
      await adminApi.post(`/verifications/lawyers/${selectedLawyer.id}/reject`, {
        notes: rejectNotes
      });

      const lawyerName = `${selectedLawyer.first_name} ${selectedLawyer.last_name}`;
      setNotificationLawyerName(lawyerName);
      setNotificationMessage('Lawyer verification rejected successfully');
      setNotificationType('success');
      setShowDetailModal(false);
      setShowNotificationModal(true);
      setSelectedLawyer(null);
      loadLawyers();
    } catch (error) {
      console.error('Error rejecting lawyer:', error);
      setNotificationMessage('Failed to reject lawyer. Please try again.');
      setNotificationType('error');
      setShowNotificationModal(true);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredLawyers = (lawyers || []).filter(lawyer => {
    const fullName = `${lawyer.first_name} ${lawyer.last_name}`.toLowerCase();
    const email = lawyer.user?.email?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();

    return fullName.includes(query) ||
           email.includes(query) ||
           lawyer.ibp_number?.toLowerCase().includes(query) ||
           lawyer.license_number?.toLowerCase().includes(query);
  });

  const getVerificationStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Verified</span>;
      case 'rejected':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Rejected</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Pending</span>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div>
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lawyer Verifications</h1>
          <p className="text-gray-600">Review and verify lawyer credentials and documents</p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <p className="text-gray-600 text-sm">Pending Verification</p>
            <p className="text-2xl font-bold text-yellow-600">
              {lawyers.filter(l => l.verification_status === 'pending').length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <p className="text-gray-600 text-sm">Verified</p>
            <p className="text-2xl font-bold text-green-600">
              {lawyers.filter(l => l.verification_status === 'verified').length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <p className="text-gray-600 text-sm">Rejected</p>
            <p className="text-2xl font-bold text-red-600">
              {lawyers.filter(l => l.verification_status === 'rejected').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, email, IBP number, or license..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="pending">Pending Verification</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
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
                    Lawyer Info
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Credentials
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Specializations
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLawyers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
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
                              {lawyer.first_name.charAt(0)}{lawyer.last_name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {lawyer.first_name} {lawyer.last_name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {lawyer.user?.email || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div>IBP: {lawyer.ibp_number}</div>
                          <div className="text-gray-600">License: {lawyer.license_number}</div>
                          {lawyer.prc_license_number && (
                            <div className="text-gray-600">PRC: {lawyer.prc_license_number}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">
                          {lawyer.specializations?.map(s => s.name).join(', ') || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getVerificationStatusBadge(lawyer.verification_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(lawyer.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => viewLawyerDetails(lawyer)}
                          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition"
                        >
                          Review
                        </button>
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
          Showing {filteredLawyers.length} of {lawyers.length} lawyers
        </div>
      </div>
    </PageTransition>

        {/* Detail Modal - Moved outside PageTransition to fix z-index */}
        {showDetailModal && selectedLawyer && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
            onClick={() => setShowDetailModal(false)}
          >
            <div
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedLawyer.first_name} {selectedLawyer.last_name}
                  </h2>
                  <p className="text-gray-600">{selectedLawyer.user?.email}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Full Name</label>
                      <p className="text-gray-900 font-medium">{selectedLawyer.first_name} {selectedLawyer.last_name}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Email</label>
                      <p className="text-gray-900 font-medium">{selectedLawyer.user?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Office Phone</label>
                      <p className="text-gray-900 font-medium">{selectedLawyer.office_phone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Years of Experience</label>
                      <p className="text-gray-900 font-medium">{selectedLawyer.years_experience} years</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm text-gray-600">Office Address</label>
                      <p className="text-gray-900 font-medium">{selectedLawyer.office_address}</p>
                    </div>
                  </div>
                </div>

                {/* Professional Credentials */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Professional Credentials</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">IBP Number</label>
                      <p className="text-gray-900 font-medium">{selectedLawyer.ibp_number}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">License Number</label>
                      <p className="text-gray-900 font-medium">{selectedLawyer.license_number}</p>
                    </div>
                    {selectedLawyer.prc_license_number && (
                      <div>
                        <label className="text-sm text-gray-600">PRC License Number</label>
                        <p className="text-gray-900 font-medium">{selectedLawyer.prc_license_number}</p>
                      </div>
                    )}
                    {selectedLawyer.roll_of_attorneys_number && (
                      <div>
                        <label className="text-sm text-gray-600">Roll of Attorneys Number</label>
                        <p className="text-gray-900 font-medium">{selectedLawyer.roll_of_attorneys_number}</p>
                      </div>
                    )}
                    <div className="col-span-2">
                      <label className="text-sm text-gray-600">Specializations</label>
                      <p className="text-gray-900 font-medium">
                        {selectedLawyer.specializations?.map(s => s.name).join(', ') || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Verification Documents */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Verification Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedLawyer.verification_documents && Object.keys(selectedLawyer.verification_documents).map((docType) => (
                      <div key={docType} className="border border-gray-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-900 mb-2 capitalize">
                          {docType.replace(/_/g, ' ')}
                        </p>
                        {documentUrls[docType] ? (
                          <button
                            onClick={async () => {
                              try {
                                const token = sessionStorage.getItem('admin_token');
                                const response = await fetch(documentUrls[docType], {
                                  headers: {
                                    'Authorization': `Bearer ${token}`
                                  }
                                });

                                if (!response.ok) {
                                  const errorData = await response.json().catch(() => ({ message: 'Failed to load document' }));
                                  throw new Error(errorData.message || 'Failed to load document');
                                }

                                // Get the blob and content type
                                const blob = await response.blob();
                                const contentType = response.headers.get('Content-Type') || 'application/octet-stream';

                                // Create blob with correct MIME type for inline viewing
                                const viewableBlob = new Blob([blob], { type: contentType });
                                const url = window.URL.createObjectURL(viewableBlob);

                                // Open in new tab for inline viewing
                                const newWindow = window.open(url, '_blank');

                                if (!newWindow) {
                                  throw new Error('Pop-up blocked. Please allow pop-ups for this site.');
                                }

                                // Clean up after window loads
                                setTimeout(() => {
                                  window.URL.revokeObjectURL(url);
                                }, 100);
                              } catch (error: any) {
                                console.error('Error viewing document:', error);
                                alert(error.message || 'Failed to view document. Please try again.');
                              }
                            }}
                            className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Document
                          </button>
                        ) : (
                          <span className="text-gray-500 text-sm">Document not available</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verification Status */}
                {selectedLawyer.verification_status !== 'pending' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Verification Status</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Status:</span>
                        {getVerificationStatusBadge(selectedLawyer.verification_status)}
                      </div>
                      {selectedLawyer.verified_by && (
                        <div className="text-sm text-gray-600 mb-2">
                          Verified by: {selectedLawyer.verified_by.name}
                        </div>
                      )}
                      {selectedLawyer.verified_at && (
                        <div className="text-sm text-gray-600 mb-2">
                          Verified on: {new Date(selectedLawyer.verified_at).toLocaleString()}
                        </div>
                      )}
                      {selectedLawyer.verification_notes && (
                        <div className="mt-3">
                          <label className="text-sm text-gray-600 font-medium">Notes:</label>
                          <p className="text-gray-900 mt-1">{selectedLawyer.verification_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons - Only show for pending */}
                {selectedLawyer.verification_status === 'pending' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Approval Notes (Optional)
                      </label>
                      <textarea
                        value={approveNotes}
                        onChange={(e) => setApproveNotes(e.target.value)}
                        placeholder="Add any notes for this approval..."
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rejection Reason (Required if rejecting)
                      </label>
                      <textarea
                        value={rejectNotes}
                        onChange={(e) => setRejectNotes(e.target.value)}
                        placeholder="Provide detailed reason for rejection (minimum 10 characters)..."
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={handleApproveLawyer}
                        disabled={actionLoading}
                        className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading ? 'Processing...' : 'Approve & Verify'}
                      </button>
                      <button
                        onClick={handleRejectLawyer}
                        disabled={actionLoading}
                        className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                )}
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
    </>
  );
};

export default AdminVerifications;
