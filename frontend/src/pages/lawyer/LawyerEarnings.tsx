import { useState, useEffect } from 'react';
import { lawyerApi } from '../../services/lawyerApi';
import {
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Wallet,
  DollarSign,
  CreditCard,
  ArrowUpRight,
  Settings,
  Banknote
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
  const [selectedPayoutMethod, setSelectedPayoutMethod] = useState<'gcash' | 'bank'>('gcash');
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
      // Handle different response structures - getPayouts now returns { payouts: [], message: string }
      const payoutsData = response.payouts || (Array.isArray(response) ? response : []);
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

    // Check if selected payout method info is set
    if (selectedPayoutMethod === 'gcash') {
      if (!earnings.payoutInfo.gcash_number) {
        alert('Please set up your GCash information first');
        setShowPayoutModal(false);
        setShowPayoutInfoRequiredModal(true);
        return;
      }
    } else {
      if (!earnings.payoutInfo.bank_account_number || !earnings.payoutInfo.bank_name) {
        alert('Please set up your bank information first');
        setShowPayoutModal(false);
        setShowPayoutInfoRequiredModal(true);
        return;
      }
    }

    try {
      setSubmittingPayout(true);
      await lawyerApi.requestPayout(amount, selectedPayoutMethod);
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
      <div className="space-y-6 animate-fadeIn">
        {/* Header Skeleton - matching actual design */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2.5 bg-emerald-100 rounded-xl">
                  <Wallet className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="h-8 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-56 ml-14 animate-pulse"></div>
            </div>
            <div className="h-11 bg-gray-200 rounded-xl w-40 animate-pulse"></div>
          </div>
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {/* Available Balance - Gradient Card */}
          <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-white/30 rounded w-28"></div>
                <div className="p-2 bg-white/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-white/50" />
                </div>
              </div>
              <div className="h-9 bg-white/30 rounded w-32 mb-4"></div>
              <div className="h-11 bg-white/40 rounded-xl w-full"></div>
            </div>
          </div>

          {/* Total Earnings */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="p-2.5 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg shadow-blue-200/50">
                <TrendingUp className="w-5 h-5 text-white/50" />
              </div>
            </div>
            <div className="h-9 bg-gray-200 rounded w-28 mb-2"></div>
            <div className="h-4 bg-gray-100 rounded w-20"></div>
          </div>

          {/* Platform Fees */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="p-2.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg shadow-amber-200/50">
                <CreditCard className="w-5 h-5 text-white/50" />
              </div>
            </div>
            <div className="h-9 bg-gray-200 rounded w-28 mb-2"></div>
            <div className="h-4 bg-gray-100 rounded w-16"></div>
          </div>

          {/* Pending Payouts */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-gray-200 rounded w-28"></div>
              <div className="p-2.5 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl shadow-lg shadow-purple-200/50">
                <Clock className="w-5 h-5 text-white/50" />
              </div>
            </div>
            <div className="h-9 bg-gray-200 rounded w-28 mb-2"></div>
            <div className="h-4 bg-gray-100 rounded w-24"></div>
          </div>
        </div>

        {/* Recent Earnings Table Skeleton */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden animate-pulse">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="h-6 bg-gray-200 rounded w-36"></div>
          </div>
          <div className="divide-y divide-gray-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-24"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-5 bg-gray-200 rounded w-20 mb-1"></div>
                  <div className="h-3 bg-gray-100 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payout History Table Skeleton */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden animate-pulse">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="h-6 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="divide-y divide-gray-100">
            {[1, 2].map((i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-32"></div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                  <div className="h-5 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
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
    <div className="space-y-6 animate-fadeIn">
      {/* Header - Clean transparent style */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 bg-emerald-100 rounded-xl">
                <Wallet className="w-6 h-6 text-emerald-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Earnings & Payouts</h1>
            </div>
            <p className="text-gray-500 ml-14">Track your revenue and manage payouts</p>
          </div>
          <button
            onClick={() => setShowPayoutInfoModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 border-2 border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all font-medium"
          >
            <Settings className="w-4 h-4" />
            Payout Settings
          </button>
        </div>
      </div>

      {/* Summary Cards - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance - Primary Card */}
        <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-green-100 uppercase tracking-wide">Available Balance</p>
              <div className="p-2 bg-white/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-4">
              ₱{earnings.availableBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </p>
            <button
              onClick={() => setShowPayoutModal(true)}
              disabled={earnings.availableBalance <= 0}
              className="w-full px-4 py-2.5 bg-white text-green-700 rounded-xl font-semibold hover:bg-green-50 disabled:bg-white/50 disabled:text-green-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <ArrowUpRight className="w-4 h-4" />
              Request Payout
            </button>
          </div>
        </div>

        {/* Total Earnings */}
        <div className="group bg-white rounded-2xl border-2 border-gray-100 p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Earnings</p>
            <div className="p-2.5 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg shadow-blue-200/50">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ₱{earnings.totalEarnings.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-gray-500 mt-2">Net after fees</p>
        </div>

        {/* Platform Fees */}
        <div className="group bg-white rounded-2xl border-2 border-gray-100 p-6 hover:shadow-lg hover:border-amber-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Platform Fees</p>
            <div className="p-2.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg shadow-amber-200/50">
              <Banknote className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ₱{earnings.totalPlatformFees.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-gray-500 mt-2">20% of gross</p>
        </div>

        {/* Pending Payouts */}
        <div className="group bg-white rounded-2xl border-2 border-gray-100 p-6 hover:shadow-lg hover:border-purple-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Pending Payouts</p>
            <div className="p-2.5 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl shadow-lg shadow-purple-200/50">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ₱{earnings.pendingPayouts.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-gray-500 mt-2">Being processed</p>
        </div>
      </div>

      {/* Payout Info Alert - Enhanced */}
      {(!earnings.payoutInfo.gcash_number && !earnings.payoutInfo.bank_account_number) && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-amber-100 rounded-xl">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900">Payout Information Required</h3>
              <p className="text-sm text-amber-700 mt-1">
                Please set up your GCash or bank account information to receive payouts.
              </p>
              <button
                onClick={() => setShowPayoutInfoModal(true)}
                className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors text-sm"
              >
                Set Up Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Earnings - Enhanced */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Recent Earnings</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Gross Amount
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Platform Fee (20%)
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Net Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {!earnings.recentEarnings || earnings.recentEarnings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <DollarSign className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500">No earnings yet</p>
                    <p className="text-sm text-gray-400 mt-1">Complete consultations to start earning</p>
                  </td>
                </tr>
              ) : (
                earnings.recentEarnings.map((earning) => (
                  <tr key={earning.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {new Date(earning.completed_at).toLocaleDateString('en-PH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {earning.client_name || earning.appointment?.client_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₱{earning.gross_amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="text-red-600 bg-red-50 px-2 py-1 rounded-lg font-medium">
                        -₱{earning.platform_fee.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="text-green-700 bg-green-50 px-2 py-1 rounded-lg font-semibold">
                        ₱{earning.net_amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout History */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CreditCard className="w-4 h-4 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Payout History</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Requested
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Account
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CreditCard className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500">No payout requests yet</p>
                    <p className="text-sm text-gray-400 mt-1">Request a payout when you have available balance</p>
                  </td>
                </tr>
              ) : (
                payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {new Date(payout.requested_at).toLocaleDateString('en-PH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ₱{payout.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 py-1 bg-gray-100 rounded-lg text-gray-700 uppercase font-medium text-xs">
                        {payout.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payout Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={earnings.availableBalance}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter amount"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payout Method
                  </label>
                  <div className="space-y-2">
                    {earnings.payoutInfo.gcash_number && (
                      <label
                        className={`flex items-center p-3 border rounded-md cursor-pointer ${
                          selectedPayoutMethod === 'gcash'
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payoutMethod"
                          value="gcash"
                          checked={selectedPayoutMethod === 'gcash'}
                          onChange={() => setSelectedPayoutMethod('gcash')}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">GCash</p>
                          <p className="text-sm text-gray-600">{earnings.payoutInfo.gcash_number}</p>
                          {earnings.payoutInfo.gcash_account_name && (
                            <p className="text-sm text-gray-500">{earnings.payoutInfo.gcash_account_name}</p>
                          )}
                        </div>
                      </label>
                    )}

                    {earnings.payoutInfo.bank_account_number && (
                      <label
                        className={`flex items-center p-3 border rounded-md cursor-pointer ${
                          selectedPayoutMethod === 'bank'
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payoutMethod"
                          value="bank"
                          checked={selectedPayoutMethod === 'bank'}
                          onChange={() => setSelectedPayoutMethod('bank')}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{earnings.payoutInfo.bank_name}</p>
                          <p className="text-sm text-gray-600">{earnings.payoutInfo.bank_account_number}</p>
                          {earnings.payoutInfo.bank_account_name && (
                            <p className="text-sm text-gray-500">{earnings.payoutInfo.bank_account_name}</p>
                          )}
                        </div>
                      </label>
                    )}
                  </div>
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
