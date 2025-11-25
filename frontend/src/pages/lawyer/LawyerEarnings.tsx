import { useState, useEffect } from 'react';
import { lawyerApi } from '../../services/lawyerApi';
import {
  TrendingUp,
  Clock,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

interface EarningsSummary {
  availableBalance: number;
  totalEarnings: number;
  totalPlatformFees: number;
  pendingPayouts: number;
  recentEarnings: Array<{
    id: number;
    appointment_id: number;
    gross_amount: number;
    platform_fee: number;
    net_amount: number;
    completed_at: string;
    client_name?: string;
    appointment?: {
      client_name: string;
      appointment_date: string;
    };
  }>;
  payoutInfo: {
    gcash_number: string | null;
    gcash_account_name: string | null;
    bank_name: string | null;
    bank_account_number: string | null;
    bank_account_name: string | null;
    preferred_payout_method: 'gcash' | 'bank';
  };
}

interface Payout {
  id: number;
  amount: number;
  method: 'gcash' | 'bank';
  account_number: string;
  account_name: string;
  bank_name: string | null;
  status: 'pending' | 'approved' | 'processing' | 'paid' | 'rejected';
  requested_at: string;
  approved_at: string | null;
  paid_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  transaction_reference: string | null;
}

export default function LawyerEarnings() {
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showPayoutInfoModal, setShowPayoutInfoModal] = useState(false);
  const [showPayoutInfoRequiredModal, setShowPayoutInfoRequiredModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [submittingPayout, setSubmittingPayout] = useState(false);

  // Payout info form
  const [payoutInfo, setPayoutInfo] = useState<{
    gcash_number: string | null;
    gcash_account_name: string | null;
    bank_name: string | null;
    bank_account_number: string | null;
    bank_account_name: string | null;
    preferred_payout_method: 'gcash' | 'bank';
  }>({
    gcash_number: '',
    gcash_account_name: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
    preferred_payout_method: 'gcash'
  });

  useEffect(() => {
    fetchEarnings();
    fetchPayouts();
  }, []);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const response = await lawyerApi.getEarnings();

      // Transform backend response to match frontend structure
      const backendData = response.data || response;
      const transformedData: EarningsSummary = {
        availableBalance: backendData.summary?.available_balance || 0,
        totalEarnings: backendData.summary?.net_earnings || 0,
        totalPlatformFees: backendData.summary?.platform_fees || 0,
        pendingPayouts: backendData.summary?.pending_payouts || 0,
        recentEarnings: backendData.recent_earnings || [],
        payoutInfo: backendData.payout_info || {
          gcash_number: null,
          gcash_account_name: null,
          bank_name: null,
          bank_account_number: null,
          bank_account_name: null,
          preferred_payout_method: 'gcash'
        }
      };

      setEarnings(transformedData);
      setPayoutInfo(transformedData.payoutInfo);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayouts = async () => {
    try {
      const response = await lawyerApi.getPayouts();
      // Handle different response structures
      const payoutsData = response.payouts || response.data || (Array.isArray(response) ? response : []);
      setPayouts(payoutsData);
    } catch (err: any) {
      console.error('Failed to load payouts:', err);
      setPayouts([]); // Set to empty array on error
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!earnings) return;

    if (amount > earnings.availableBalance) {
      alert('Insufficient balance');
      return;
    }

    // Check if payout info is set
    if (earnings.payoutInfo.preferred_payout_method === 'gcash') {
      if (!earnings.payoutInfo.gcash_number || !earnings.payoutInfo.gcash_account_name) {
        setShowPayoutModal(false);
        setShowPayoutInfoRequiredModal(true);
        return;
      }
    } else {
      if (!earnings.payoutInfo.bank_account_number || !earnings.payoutInfo.bank_account_name || !earnings.payoutInfo.bank_name) {
        setShowPayoutModal(false);
        setShowPayoutInfoRequiredModal(true);
        return;
      }
    }

    try {
      setSubmittingPayout(true);
      await lawyerApi.requestPayout(amount);
      setShowPayoutModal(false);
      setPayoutAmount('');
      setSuccessMessage('Payout request submitted successfully!');
      setShowSuccessModal(true);
      fetchEarnings();
      fetchPayouts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit payout request');
    } finally {
      setSubmittingPayout(false);
    }
  };

  const handleUpdatePayoutInfo = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Convert null to undefined for API call
      const apiPayload = {
        gcash_number: payoutInfo.gcash_number || undefined,
        gcash_account_name: payoutInfo.gcash_account_name || undefined,
        bank_name: payoutInfo.bank_name || undefined,
        bank_account_number: payoutInfo.bank_account_number || undefined,
        bank_account_name: payoutInfo.bank_account_name || undefined,
        preferred_payout_method: payoutInfo.preferred_payout_method
      };
      await lawyerApi.updatePayoutInfo(apiPayload);
      setShowPayoutInfoModal(false);
      setSuccessMessage('Payout information updated successfully!');
      setShowSuccessModal(true);
      fetchEarnings();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update payout information');
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !earnings) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-red-800">{error || 'Failed to load earnings'}</p>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Earnings & Payouts</h1>
        <button
          onClick={() => setShowPayoutInfoModal(true)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:bg-gray-100 transition-all"
        >
          Payout Settings
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available Balance</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ₱{earnings.availableBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
            </div>
              <div className="p-3 bg-green-100 rounded-full">
              <span className="w-6 h-6 text-green-600 flex items-center justify-center text-base">₱</span>
            </div>
          </div>
          <button
            onClick={() => setShowPayoutModal(true)}
            disabled={earnings.availableBalance < 500}
            className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Request Payout
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ₱{earnings.totalEarnings.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Platform Fees</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ₱{earnings.totalPlatformFees.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Payouts</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ₱{earnings.pendingPayouts.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Payout Info Alert */}
      {(!earnings.payoutInfo.gcash_number && !earnings.payoutInfo.bank_account_number) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-900">Payout Information Required</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Please set up your GCash or bank account information to receive payouts.
              </p>
              <button
                onClick={() => setShowPayoutInfoModal(true)}
                className="mt-2 text-sm font-medium text-yellow-900 underline hover:text-yellow-800"
              >
                Set Up Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Earnings */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Earnings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gross Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform Fee (20%)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {!earnings.recentEarnings || earnings.recentEarnings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No earnings yet
                  </td>
                </tr>
              ) : (
                earnings.recentEarnings.map((earning) => (
                  <tr key={earning.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(earning.completed_at).toLocaleDateString('en-PH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {earning.client_name || earning.appointment?.client_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₱{earning.gross_amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      -₱{earning.platform_fee.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ₱{earning.net_amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout History */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Payout History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No payout requests yet
                  </td>
                </tr>
              ) : (
                payouts.map((payout) => (
                  <tr key={payout.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(payout.requested_at).toLocaleDateString('en-PH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₱{payout.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 uppercase">
                      {payout.method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payout.method === 'gcash'
                        ? payout.account_number
                        : `${payout.bank_name} - ${payout.account_number}`
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payout.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payout.transaction_reference || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

      {/* Request Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Request Payout</h3>
            </div>
            <form onSubmit={handleRequestPayout} className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Available Balance: <span className="font-semibold text-gray-900">
                      ₱{earnings.availableBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Minimum Payout: <span className="font-semibold text-gray-900">₱500.00</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payout Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="500"
                    max={earnings.availableBalance}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter amount"
                    required
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Payout Method:</strong> {earnings.payoutInfo.preferred_payout_method.toUpperCase()}
                  </p>
                  <p className="text-sm text-blue-800 mt-1">
                    <strong>Account:</strong>{' '}
                    {earnings.payoutInfo.preferred_payout_method === 'gcash'
                      ? earnings.payoutInfo.gcash_number
                      : `${earnings.payoutInfo.bank_name} - ${earnings.payoutInfo.bank_account_number}`
                    }
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPayoutModal(false);
                    setPayoutAmount('');
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayout}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {submittingPayout ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payout Info Modal */}
      {showPayoutInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] overflow-y-auto p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8 animate-[fadeIn_0.2s_ease-out] overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="w-6 h-6 text-white flex items-center justify-center text-base">₱</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Payout Settings</h3>
                  <p className="text-sm text-gray-600 mt-0.5">Configure your payment method</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleUpdatePayoutInfo} className="px-8 py-6">
              <div className="space-y-8">
                <div>
                  <label className="block text-base font-semibold text-gray-900 mb-4">
                    Select Payout Method
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPayoutInfo({
                        ...payoutInfo,
                        preferred_payout_method: 'gcash',
                        bank_name: null
                      })}
                      className={`relative px-4 py-4 rounded-xl border-2 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                        payoutInfo.preferred_payout_method === 'gcash'
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-400 hover:shadow-md'
                      }`}
                    >
                      {payoutInfo.preferred_payout_method === 'gcash' && (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      GCash
                    </button>
                    {['BDO', 'BPI', 'Metrobank', 'UnionBank', 'Landbank', 'PNB'].map((bank) => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => setPayoutInfo({
                          ...payoutInfo,
                          preferred_payout_method: 'bank',
                          bank_name: bank
                        })}
                        className={`relative px-4 py-4 rounded-xl border-2 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                          payoutInfo.bank_name === bank
                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-400 hover:shadow-md'
                        }`}
                      >
                        {payoutInfo.bank_name === bank && (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        {bank}
                      </button>
                    ))}
                  </div>
                  {payoutInfo.bank_name && !['BDO', 'BPI', 'Metrobank', 'UnionBank', 'Landbank', 'PNB'].includes(payoutInfo.bank_name) && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                      <input
                        type="text"
                        value={payoutInfo.bank_name || ''}
                        onChange={(e) => setPayoutInfo({
                          ...payoutInfo,
                          bank_name: e.target.value
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="Enter bank name"
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setPayoutInfo({
                      ...payoutInfo,
                      preferred_payout_method: 'bank',
                      bank_name: 'Other'
                    })}
                    className="mt-4 px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-semibold hover:bg-indigo-50 rounded-lg transition-all inline-flex items-center gap-1"
                  >
                    <span className="text-lg">+</span> Other Bank
                  </button>
                </div>

                {/* GCash Fields */}
                {payoutInfo.preferred_payout_method === 'gcash' && (
                  <div className="space-y-5 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="font-semibold text-gray-900">GCash Information</span>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        GCash Number
                      </label>
                      <input
                        type="text"
                        value={payoutInfo.gcash_number || ''}
                        onChange={(e) => setPayoutInfo({
                          ...payoutInfo,
                          gcash_number: e.target.value
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white shadow-sm"
                        placeholder="09XX XXX XXXX"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        GCash Account Name
                      </label>
                      <input
                        type="text"
                        value={payoutInfo.gcash_account_name || ''}
                        onChange={(e) => setPayoutInfo({
                          ...payoutInfo,
                          gcash_account_name: e.target.value
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white shadow-sm"
                        placeholder="Full name as registered in GCash"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Bank Fields */}
                {payoutInfo.preferred_payout_method === 'bank' && (
                  <div className="space-y-5 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <span className="font-semibold text-gray-900">Bank Account Information</span>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Bank Account Number
                      </label>
                      <input
                        type="text"
                        value={payoutInfo.bank_account_number || ''}
                        onChange={(e) => setPayoutInfo({
                          ...payoutInfo,
                          bank_account_number: e.target.value
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white shadow-sm"
                        placeholder="Account number"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Bank Account Name
                      </label>
                      <input
                        type="text"
                        value={payoutInfo.bank_account_name || ''}
                        onChange={(e) => setPayoutInfo({
                          ...payoutInfo,
                          bank_account_name: e.target.value
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white shadow-sm"
                        placeholder="Full name as registered in bank"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowPayoutInfoModal(false)}
                  className="flex-1 px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-all hover:border-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:scale-105"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payout Info Required Modal */}
      {showPayoutInfoRequiredModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Payout Information Required</h3>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 mb-4">
                    Please set up your {earnings?.payoutInfo.preferred_payout_method === 'gcash' ? 'GCash' : 'bank account'} information first before requesting a payout.
                  </p>
                  <p className="text-sm text-gray-600">
                    You need to configure your payout details to receive payments.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex gap-3 rounded-b-lg">
              <button
                type="button"
                onClick={() => setShowPayoutInfoRequiredModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPayoutInfoRequiredModal(false);
                  setShowPayoutInfoModal(true);
                }}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Set Up Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">Success!</h3>
              <p className="text-gray-600 text-center">{successMessage}</p>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
