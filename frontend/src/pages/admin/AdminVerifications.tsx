import React, { useEffect, useState } from 'react';
import adminApi, { clearAdminCache } from '../../services/adminApi';

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
  }, []);

  // Prevent body scroll when modals are open and prevent layout shift
  useEffect(() => {
    if (showDetailModal || showNotificationModal) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '';
    };
  }, [showDetailModal, showNotificationModal]);

  const loadLawyers = async (forceRefresh = false) => {
    try {
      setLoading(true);

      if (forceRefresh) {
        clearAdminCache();
      }

      // Load only pending verification lawyers
      const response = await adminApi.get('/verifications/lawyers?status=pending');

      const lawyersData = response.data.lawyers || [];
      setLawyers(lawyersData);
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
      loadLawyers(true);
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
      loadLawyers(true);
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

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div>
          <div className="h-9 bg-gray-200 rounded w-56 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-72"></div>
        </div>

        {/* Stats Skeleton */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-4 bg-gray-200 rounded w-28 mb-2"></div>
              <div className="h-10 bg-amber-100 rounded w-16 mb-1"></div>
              <div className="h-3 bg-gray-100 rounded w-36"></div>
            </div>
            <div className="w-16 h-16 bg-amber-50 rounded-2xl"></div>
          </div>
        </div>

        {/* Search Skeleton */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="h-12 bg-gray-100 rounded-xl"></div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div>
                    <div className="h-5 bg-gray-200 rounded w-40 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-48"></div>
                  </div>
                </div>
                <div className="h-9 bg-blue-100 rounded-lg w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pending Verifications</h1>
          <p className="text-gray-600">Review and verify lawyer credentials and documents</p>
        </div>

        {/* Pending Count Card */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Awaiting Review</p>
              <p className="text-4xl font-bold text-gray-900 mt-1">{lawyers.length}</p>
              <p className="text-sm text-gray-500 mt-1">lawyers need verification</p>
            </div>
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="relative">
            <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, IBP number, or license..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Lawyers Table - Desktop */}
        <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-green-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-gray-900 font-medium">All caught up!</p>
                        <p className="text-gray-500 text-sm">No pending verifications at the moment.</p>
                      </div>
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
                            <div className="text-sm font-semibold text-gray-900">
                              {lawyer.first_name} {lawyer.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{lawyer.user?.email || lawyer.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">IBP: {lawyer.ibp_number}</div>
                        <div className="text-sm text-gray-500">License: {lawyer.license_number}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">
                          {lawyer.specializations?.map(s => s.name).join(', ') || 'Not specified'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(lawyer.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => viewLawyerDetails(lawyer)}
                          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
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
          {filteredLawyers.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">
                Showing {filteredLawyers.length} of {lawyers.length} pending verifications
              </p>
            </div>
          )}
        </div>

        {/* Lawyers Cards - Mobile */}
        <div className="md:hidden space-y-3">
          {filteredLawyers.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <svg className="w-12 h-12 text-green-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-900 font-medium">All caught up!</p>
              <p className="text-gray-500 text-sm mt-1">No pending verifications at the moment.</p>
            </div>
          ) : (
            filteredLawyers.map((lawyer) => (
              <div key={lawyer.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">
                      {lawyer.first_name.charAt(0)}{lawyer.last_name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {lawyer.first_name} {lawyer.last_name}
                    </h3>
                    <p className="text-xs text-gray-600 truncate">{lawyer.user?.email || lawyer.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 py-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">IBP Number</p>
                    <p className="text-sm font-medium text-gray-900">{lawyer.ibp_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">License</p>
                    <p className="text-sm font-medium text-gray-900">{lawyer.license_number}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Specializations</p>
                    <p className="text-sm font-medium text-gray-900">
                      {lawyer.specializations?.map(s => s.name).join(', ') || 'Not specified'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Submitted</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(lawyer.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <button
                    onClick={() => viewLawyerDetails(lawyer)}
                    className="w-full px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition text-sm"
                  >
                    Review Application
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

        {/* Detail Modal */}
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
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name</label>
                      <p className="text-gray-900 font-semibold mt-1">{selectedLawyer.first_name} {selectedLawyer.last_name}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                      <p className="text-gray-900 font-semibold mt-1 break-all">{selectedLawyer.user?.email}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Office Phone</label>
                      <p className="text-gray-900 font-semibold mt-1">{selectedLawyer.office_phone || 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Years of Experience</label>
                      <p className="text-gray-900 font-semibold mt-1">{selectedLawyer.years_experience} years</p>
                    </div>
                    <div className="col-span-full bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Office Address</label>
                      <p className="text-gray-900 font-semibold mt-1">{selectedLawyer.office_address}</p>
                    </div>
                  </div>
                </div>

                {/* Professional Credentials */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Professional Credentials</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">IBP Number</label>
                      <p className="text-gray-900 font-semibold mt-1">{selectedLawyer.ibp_number}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">License Number</label>
                      <p className="text-gray-900 font-semibold mt-1">{selectedLawyer.license_number}</p>
                    </div>
                    {selectedLawyer.prc_license_number && (
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">PRC License Number</label>
                        <p className="text-gray-900 font-semibold mt-1">{selectedLawyer.prc_license_number}</p>
                      </div>
                    )}
                    {selectedLawyer.roll_of_attorneys_number && (
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Roll of Attorneys Number</label>
                        <p className="text-gray-900 font-semibold mt-1">{selectedLawyer.roll_of_attorneys_number}</p>
                      </div>
                    )}
                    <div className="col-span-full bg-white rounded-lg p-3 shadow-sm">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Specializations</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedLawyer.specializations?.map((s) => (
                          <span key={s.id} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                            {s.name}
                          </span>
                        )) || <span className="text-gray-500">N/A</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Documents */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Verification Documents</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedLawyer.verification_documents && Object.keys(selectedLawyer.verification_documents).map((docType) => (
                      <div key={docType} className="bg-white border-2 border-green-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 capitalize">
                                {docType.replace(/_/g, ' ')}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">Verification Document</p>
                            </div>
                          </div>
                        </div>
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
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Document
                          </button>
                        ) : (
                          <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-500 rounded-lg text-sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Document not available
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                {selectedLawyer.verification_status === 'pending' && (
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-5 border border-gray-200 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Review Decision</h3>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Approval Notes (Optional)
                      </label>
                      <textarea
                        value={approveNotes}
                        onChange={(e) => setApproveNotes(e.target.value)}
                        placeholder="Add any notes for this approval..."
                        rows={2}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      />
                    </div>

                    <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Rejection Reason (Required if rejecting)
                      </label>
                      <textarea
                        value={rejectNotes}
                        onChange={(e) => setRejectNotes(e.target.value)}
                        placeholder="Provide detailed reason for rejection (minimum 10 characters)..."
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <button
                        onClick={handleApproveLawyer}
                        disabled={actionLoading}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {actionLoading ? 'Processing...' : 'Approve & Verify'}
                      </button>
                      <button
                        onClick={handleRejectLawyer}
                        disabled={actionLoading}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
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
