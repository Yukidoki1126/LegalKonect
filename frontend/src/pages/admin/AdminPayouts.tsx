import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { adminPayoutService } from '../../services/adminApi';
import {
  
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  Filter,
  X
} from 'lucide-react';

interface Payout {
  id: number;
  amount: number;
  payout_method?: 'gcash' | 'bank';
  method?: 'gcash' | 'bank'; // Backend might use 'method' instead
  payout_account_number?: string;
  account_number?: string; // Backend might use this
  payout_account_name?: string;
  account_name?: string; // Backend might use this
  bank_name: string | null;
  status: 'pending' | 'approved' | 'processing' | 'paid' | 'rejected';
  requested_at: string;
  approved_at: string | null;
  paid_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  transaction_reference: string | null;
  payment_proof_url: string | null;
  admin_notes: string | null;
  lawyer: {
    id: number;
    first_name?: string;
    last_name?: string;
    name?: string; // Backend might use 'name' instead
    user?: {
      email: string;
    };
    email?: string; // Backend might put email directly
  };
}

export default function AdminPayouts() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showPaidModal, setShowPaidModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Form states
  const [transactionReference, setTransactionReference] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (showApproveModal || showPaidModal || showRejectModal || showSuccessModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showApproveModal, showPaidModal, showRejectModal, showSuccessModal]);

  useEffect(() => {
    fetchPayouts();
  }, [statusFilter]);

  // Real-time polling - refresh every 10 seconds
  useEffect(() => {
    if (!isAutoRefresh) return;
    
    const interval = setInterval(() => {
      fetchPayoutsSilent();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [statusFilter, isAutoRefresh]);

  // Silent fetch without loading state (for real-time updates)
  const fetchPayoutsSilent = async () => {
    try {
      const response = await adminPayoutService.getPayouts(statusFilter);
      const payoutsData = Array.isArray(response) ? response : (response.data || []);
      setPayouts(payoutsData);
      setLastUpdated(new Date());
      setError('');
    } catch (err: any) {
      // Silent fail for background updates
      console.error('Background refresh failed:', err);
    }
  };

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const response = await adminPayoutService.getPayouts(statusFilter);
      // Handle both paginated response (response.data) and direct array
      const payoutsData = Array.isArray(response) ? response : (response.data || []);
      setPayouts(payoutsData);
      setLastUpdated(new Date());
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayout = async () => {
    if (!selectedPayout) return;

    try {
      setSubmitting(true);
      await adminPayoutService.approvePayout(selectedPayout.id);
      setShowApproveModal(false);
      setSelectedPayout(null);
      setSuccessMessage('Payout approved successfully!');
      setShowSuccessModal(true);
      fetchPayouts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve payout');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayout) return;

    if (!transactionReference.trim()) {
      alert('Please enter a transaction reference');
      return;
    }

    if (!paymentProof) {
      alert('Please upload a payment proof screenshot');
      return;
    }

    try {
      setSubmitting(true);
      
      // Use FormData for file upload
      const formData = new FormData();
      formData.append('transaction_reference', transactionReference);
      if (adminNotes) {
        formData.append('admin_notes', adminNotes);
      }
      formData.append('payment_proof', paymentProof);

      await adminPayoutService.markAsPaidWithProof(selectedPayout.id, formData);
      
      setShowPaidModal(false);
      setSelectedPayout(null);
      setTransactionReference('');
      setAdminNotes('');
      setPaymentProof(null);
      setPaymentProofPreview(null);
      setSuccessMessage('Payout marked as paid successfully!');
      setShowSuccessModal(true);
      fetchPayouts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to mark payout as paid');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/gif'].includes(file.type)) {
        alert('Please upload a valid image file (JPEG, PNG, or GIF)');
        return;
      }
      
      setPaymentProof(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRejectPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayout) return;

    if (!rejectionReason.trim()) {
      alert('Please enter a rejection reason');
      return;
    }

    try {
      setSubmitting(true);
      await adminPayoutService.rejectPayout(selectedPayout.id, {
        rejection_reason: rejectionReason
      });
      setShowRejectModal(false);
      setSelectedPayout(null);
      setRejectionReason('');
      setSuccessMessage('Payout rejected successfully!');
      setShowSuccessModal(true);
      fetchPayouts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject payout');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: any; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Approved' },
      processing: { color: 'bg-purple-100 text-purple-800', icon: RefreshCw, label: 'Processing' },
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Paid' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    );
  };

  const getActionButtons = (payout: Payout) => {
    switch (payout.status) {
      case 'pending':
        return (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedPayout(payout);
                setShowApproveModal(true);
              }}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Approve
            </button>
            <button
              onClick={() => {
                setSelectedPayout(payout);
                setShowRejectModal(true);
              }}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reject
            </button>
          </div>
        );
      case 'approved':
      case 'processing':
        return (
          <button
            onClick={() => {
              setSelectedPayout(payout);
              setShowPaidModal(true);
            }}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            Mark as Paid
          </button>
        );
      default:
        return <span className="text-sm text-gray-500">-</span>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="h-9 bg-gray-200 rounded w-56"></div>
          <div className="flex items-center gap-3">
            <div className="h-10 bg-gray-200 rounded-lg w-36"></div>
            <div className="h-10 bg-gray-200 rounded-lg w-10"></div>
          </div>
        </div>

        {/* Stats Skeleton - 4 columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['pending', 'approved', 'paid', 'rejected'].map((status, i) => (
            <div key={status} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className={`h-6 rounded-full w-16 ${
                  i === 0 ? 'bg-yellow-100' :
                  i === 1 ? 'bg-blue-100' :
                  i === 2 ? 'bg-green-100' : 'bg-red-100'
                }`}></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-12 mb-1"></div>
              <div className="h-4 bg-gray-100 rounded w-24"></div>
            </div>
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-8">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-28"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
          {/* Table Rows */}
          <div className="divide-y divide-gray-200">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-8">
                <div className="flex items-center gap-3 w-40">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-gray-100 rounded w-20"></div>
                  </div>
                </div>
                <div className="h-5 bg-gray-200 rounded w-20"></div>
                <div className="h-5 bg-gray-200 rounded w-16"></div>
                <div className="h-3 bg-gray-100 rounded w-32"></div>
                <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Payout Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Review and process lawyer payout requests</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1 sm:flex-none">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto pl-10 pr-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all text-sm sm:text-base sm:min-w-[160px]"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <button
            onClick={fetchPayouts}
            className="p-2.5 sm:p-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Summary - Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
        {['pending', 'approved', 'paid', 'rejected'].map((status) => {
          // Combine pending and processing counts for the "pending" card
          const statusesToCount = status === 'pending' ? ['pending', 'processing'] : [status];
          const count = payouts.filter((p) => statusesToCount.includes(p.status)).length;
          const total = payouts
            .filter((p) => statusesToCount.includes(p.status))
            .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

          const gradients: Record<string, string> = {
            pending: 'bg-white border border-gray-200 shadow-sm',
            approved: 'bg-white border border-gray-200 shadow-sm',
            paid: 'bg-white border border-gray-200 shadow-sm',
            rejected: 'bg-white border border-gray-200 shadow-sm',
          };

          const textColors: Record<string, string> = {
            pending: 'text-gray-500',
            approved: 'text-gray-500',
            paid: 'text-gray-500',
            rejected: 'text-gray-500',
          };

          const iconBgs: Record<string, string> = {
            pending: 'bg-amber-50',
            approved: 'bg-blue-50',
            paid: 'bg-green-50',
            rejected: 'bg-red-50',
          };

          const iconColors: Record<string, string> = {
            pending: 'text-amber-500',
            approved: 'text-blue-500',
            paid: 'text-green-500',
            rejected: 'text-red-500',
          };

          return (
            <div key={status} className={`${gradients[status]} rounded-xl p-3 sm:p-5`}>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <p className={`text-xs sm:text-sm font-medium ${textColors[status]} capitalize`}>{status}</p>
                <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 ${iconBgs[status]} rounded-lg ${iconColors[status]} text-xs font-bold`}>
                  {count}
                </span>
              </div>
              <p className="text-xl sm:text-3xl font-bold text-gray-900">{count}</p>
              <p className={`text-xs sm:text-sm ${textColors[status]} mt-1 font-medium truncate`}>
                ₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
            </div>
          );
        })}
      </div>

      {/* Payouts Table - Desktop */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Lawyer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Method & Account
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Requested
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 font-medium">No payout requests found</p>
                      <p className="text-gray-400 text-sm mt-1">Payout requests will appear here</p>
                    </div>
                  </td>
                </tr>
              ) : (
                payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                          <span className="text-white font-semibold text-sm">
                            {(payout.lawyer.name || payout.lawyer.first_name || 'L').charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {payout.lawyer.name || `${payout.lawyer.first_name || ''} ${payout.lawyer.last_name || ''}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payout.lawyer.email || payout.lawyer.user?.email || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-base font-bold text-gray-900">
                        ₱{payout.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 uppercase font-medium">
                        {payout.method || payout.payout_method}
                      </div>
                      <div className="text-sm text-gray-500">
                        {(payout.method || payout.payout_method) === 'gcash'
                          ? `${payout.account_number || payout.payout_account_number}`
                          : `${payout.bank_name} - ${payout.account_number || payout.payout_account_number}`
                        }
                      </div>
                      <div className="text-sm text-gray-500">
                        {payout.account_name || payout.payout_account_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(payout.requested_at).toLocaleDateString('en-PH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payout.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payout.transaction_reference ? (
                        <div className="flex flex-col gap-1">
                          <span>{payout.transaction_reference}</span>
                          {payout.payment_proof_url && (
                            <a 
                              href={payout.payment_proof_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium inline-flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              View Proof
                            </a>
                          )}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getActionButtons(payout)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payouts Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {payouts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium text-sm">No payout requests found</p>
              <p className="text-gray-400 text-xs mt-1">Payout requests will appear here</p>
            </div>
          </div>
        ) : (
          payouts.map((payout) => (
            <div key={payout.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              {/* Header with Lawyer Info and Status */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {(payout.lawyer.name || payout.lawyer.first_name || 'L').charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {payout.lawyer.name || `${payout.lawyer.first_name || ''} ${payout.lawyer.last_name || ''}`}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {payout.lawyer.email || payout.lawyer.user?.email || 'N/A'}
                    </div>
                  </div>
                </div>
                {getStatusBadge(payout.status)}
              </div>
              
              {/* Amount */}
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <div className="text-xs text-gray-500 mb-1">Amount</div>
                <div className="text-xl font-bold text-gray-900">
                  ₱{payout.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </div>
              </div>
              
              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Method</div>
                  <div className="text-gray-900 font-medium uppercase text-xs">
                    {payout.method || payout.payout_method}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Requested</div>
                  <div className="text-gray-900 text-xs">
                    {new Date(payout.requested_at).toLocaleDateString('en-PH')}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-gray-500 mb-0.5">Account</div>
                  <div className="text-gray-900 text-xs">
                    {(payout.method || payout.payout_method) === 'gcash'
                      ? payout.account_number || payout.payout_account_number
                      : `${payout.bank_name} - ${payout.account_number || payout.payout_account_number}`
                    }
                    {(payout.account_name || payout.payout_account_name) && (
                      <span className="text-gray-500 ml-1">({payout.account_name || payout.payout_account_name})</span>
                    )}
                  </div>
                </div>
                {payout.transaction_reference && (
                  <div className="col-span-2">
                    <div className="text-xs text-gray-500 mb-0.5">Reference</div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 text-xs">{payout.transaction_reference}</span>
                      {payout.payment_proof_url && (
                        <a 
                          href={payout.payment_proof_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium inline-flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          View Proof
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-end gap-2">
                  {getActionButtons(payout)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedPayout && createPortal(
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
            padding: '1rem',
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Approve Payout</h3>
                  <p className="text-sm text-gray-600 mt-0.5">Verify and approve this payout request</p>
                </div>
              </div>
            </div>
            <div className="px-8 py-6">
              <div className="space-y-5">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Lawyer</p>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedPayout.lawyer.name || `${selectedPayout.lawyer.first_name || ''} ${selectedPayout.lawyer.last_name || ''}`}
                  </p>
                </div>

                <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Amount</p>
                  <p className="text-4xl font-black text-gray-900">
                    ₱{selectedPayout.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Payout Method</p>
                    <p className="text-base font-bold text-gray-900 uppercase">
                      {selectedPayout.method || selectedPayout.payout_method}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Requested</p>
                    <p className="text-base font-semibold text-gray-900">
                      {new Date(selectedPayout.requested_at).toLocaleDateString('en-PH')}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Account Details</p>
                  <p className="text-base font-bold text-gray-900 mb-1">
                    {(selectedPayout.method || selectedPayout.payout_method) === 'gcash'
                      ? (selectedPayout.account_number || selectedPayout.payout_account_number)
                      : `${selectedPayout.bank_name} - ${selectedPayout.account_number || selectedPayout.payout_account_number}`
                    }
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedPayout.account_name || selectedPayout.payout_account_name}
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-4 mt-6">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900 mb-1">Important</p>
                    <p className="text-sm text-amber-800">
                      Approving this payout means you have verified the lawyer's identity
                      and payout information. You will need to manually transfer the funds after approval.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedPayout(null);
                  }}
                  className="flex-1 px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-all hover:border-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprovePayout}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg shadow-blue-200 transition-all hover:shadow-xl hover:scale-105 disabled:from-gray-400 disabled:to-gray-400 disabled:shadow-none disabled:scale-100"
                >
                  {submitting ? 'Approving...' : 'Approve Payout'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.getElementById('modal-root') || document.body
      )}

      {/* Mark as Paid Modal */}
      {showPaidModal && selectedPayout && createPortal(
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
            padding: '1rem',
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            {/* Header */}
            <div className="px-8 py-6 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Mark as Paid</h3>
                  <p className="text-sm text-gray-600 mt-0.5">Confirm payment completion with proof</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleMarkAsPaid} className="px-8 py-6">
              <div className="space-y-5">
                {/* Amount */}
                <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Amount Paid</p>
                  <p className="text-4xl font-black text-gray-900">
                    ₱{selectedPayout.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Transaction Reference */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Transaction Reference <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={transactionReference}
                    onChange={(e) => setTransactionReference(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    placeholder="Enter transaction reference number"
                    required
                  />
                </div>

                {/* Payment Proof Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Proof Screenshot <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-green-500 transition-colors">
                    {paymentProofPreview ? (
                      <div className="space-y-3">
                        <img 
                          src={paymentProofPreview} 
                          alt="Payment proof preview" 
                          className="max-h-48 mx-auto rounded-lg shadow-md"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentProof(null);
                            setPaymentProofPreview(null);
                          }}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Remove & Upload Different
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <div className="space-y-2">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-600">
                            <span className="text-green-600 font-semibold">Click to upload</span> payment screenshot
                          </p>
                          <p className="text-xs text-gray-400">PNG, JPG, GIF up to 5MB</p>
                        </div>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/jpg,image/gif"
                          onChange={handlePaymentProofChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                    placeholder="Add any notes about this payout..."
                    rows={2}
                  />
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900 mb-1">Important</p>
                      <p className="text-sm text-blue-800">
                        The payment proof will be stored and visible to both admin and the lawyer for verification purposes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaidModal(false);
                    setSelectedPayout(null);
                    setTransactionReference('');
                    setAdminNotes('');
                    setPaymentProof(null);
                    setPaymentProofPreview(null);
                  }}
                  className="flex-1 px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-all hover:border-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !paymentProof || !transactionReference.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold shadow-lg shadow-green-200 transition-all hover:shadow-xl hover:scale-105 disabled:from-gray-400 disabled:to-gray-400 disabled:shadow-none disabled:scale-100"
                >
                  {submitting ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.getElementById('modal-root') || document.body
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedPayout && createPortal(
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
            padding: '1rem',
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            {/* Header */}
            <div className="px-8 py-6 bg-gradient-to-r from-red-50 to-rose-50 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
                  <XCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Reject Payout</h3>
                  <p className="text-sm text-gray-600 mt-0.5">This action cannot be undone</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleRejectPayout} className="px-8 py-6">
              <div className="space-y-5">
                {/* Lawyer Info */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Lawyer</p>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedPayout.lawyer.name || `${selectedPayout.lawyer.first_name || ''} ${selectedPayout.lawyer.last_name || ''}`}
                  </p>
                </div>

                {/* Amount */}
                <div className="p-5 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border border-red-100">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Amount to Reject</p>
                  <p className="text-4xl font-black text-gray-900">
                    ₱{selectedPayout.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Rejection Reason */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none"
                    placeholder="Explain why this payout is being rejected..."
                    rows={4}
                    required
                  />
                </div>

                {/* Warning */}
                <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-900 mb-1">Warning</p>
                      <p className="text-sm text-red-800">
                        The lawyer will be notified of this rejection and the reason provided. 
                        The payout amount will be returned to their available balance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedPayout(null);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-all hover:border-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !rejectionReason.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 font-semibold shadow-lg shadow-red-200 transition-all hover:shadow-xl hover:scale-105 disabled:from-gray-400 disabled:to-gray-400 disabled:shadow-none disabled:scale-100"
                >
                  {submitting ? 'Rejecting...' : 'Reject Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.getElementById('modal-root') || document.body
      )}

      {/* Success Modal */}
      {showSuccessModal && createPortal(
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
            padding: '1rem',
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            <div className="px-8 py-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Success!</h3>
                <p className="text-gray-600 mb-6">{successMessage}</p>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold shadow-lg shadow-green-200 transition-all hover:shadow-xl hover:scale-105"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.getElementById('modal-root') || document.body
      )}
    </div>
  );
}
