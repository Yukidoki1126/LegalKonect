import { useState, useEffect } from 'react';
import { adminPayoutService } from '../../services/adminApi';
import {
  DollarSign,
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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPayouts();
  }, [statusFilter]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const response = await adminPayoutService.getPayouts(statusFilter);
      // Handle both paginated response (response.data) and direct array
      const payoutsData = Array.isArray(response) ? response : (response.data || []);
      setPayouts(payoutsData);
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

    try {
      setSubmitting(true);
      await adminPayoutService.markAsPaid(selectedPayout.id, {
        transaction_reference: transactionReference,
        admin_notes: adminNotes || undefined
      });
      setShowPaidModal(false);
      setSelectedPayout(null);
      setTransactionReference('');
      setAdminNotes('');
      setSuccessMessage('Payout marked as paid successfully!');
      setShowSuccessModal(true);
      fetchPayouts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to mark payout as paid');
    } finally {
      setSubmitting(false);
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Payout Management</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="processing">Processing</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <button
            onClick={fetchPayouts}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {['pending', 'approved', 'processing', 'paid', 'rejected'].map((status) => {
          const count = payouts.filter((p) => p.status === status).length;
          const total = payouts
            .filter((p) => p.status === status)
            .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

          return (
            <div key={status} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600 capitalize">{status}</p>
                {getStatusBadge(status)}
              </div>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-sm text-gray-500 mt-1">
                ₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
            </div>
          );
        })}
      </div>

      {/* Payouts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lawyer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method & Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No payout requests found
                  </td>
                </tr>
              ) : (
                payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payout.lawyer.name || `${payout.lawyer.first_name || ''} ${payout.lawyer.last_name || ''}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payout.lawyer.email || payout.lawyer.user?.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₱{payout.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
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
                      {payout.transaction_reference || '-'}
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

      {/* Approve Modal */}
      {showApproveModal && selectedPayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
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
        </div>
      )}

      {/* Mark as Paid Modal */}
      {showPaidModal && selectedPayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Mark Payout as Paid</h3>
            </div>
            <form onSubmit={handleMarkAsPaid} className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Amount:</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₱{selectedPayout.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction Reference *
                  </label>
                  <input
                    type="text"
                    value={transactionReference}
                    onChange={(e) => setTransactionReference(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter transaction reference number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Add any notes about this payout..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaidModal(false);
                    setSelectedPayout(null);
                    setTransactionReference('');
                    setAdminNotes('');
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
                >
                  {submitting ? 'Submitting...' : 'Mark as Paid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedPayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Reject Payout</h3>
            </div>
            <form onSubmit={handleRejectPayout} className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Amount:</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₱{selectedPayout.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="Explain why this payout is being rejected..."
                    rows={4}
                    required
                  />
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">
                    <strong>Warning:</strong> The lawyer will be notified of this rejection and the reason provided.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedPayout(null);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300"
                >
                  {submitting ? 'Rejecting...' : 'Reject Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
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
        </div>
      )}
    </div>
  );
}
