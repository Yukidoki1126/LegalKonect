import React, { useEffect, useState } from 'react';
import adminApi from '../../services/adminApi';
import PageTransition from '../../components/PageTransition';

interface Payment {
  id: number;
  client_name: string;
  lawyer_name: string;
  amount: number;
  platform_fee: number;
  payment_method: string;
  payment_reference: string;
  payment_date: string;
  created_at: string;
}

interface PendingRefund {
  id: number;
  client_name: string;
  client_email: string;
  lawyer_name: string;
  appointment_date: string;
  appointment_time: string;
  refund_amount: number;
  refund_reason: string;
  refund_notes: string;
  refund_requested_at: string;
  payment_reference: string;
  payment_method: string;
  cancelled_at: string;
}

interface PaymentSummary {
  total_payments: number;
  total_amount: number;
  total_revenue: number;
  platform_fees: number;
  card_payments: number;
  gcash_payments: number;
  pending_refunds_count?: number;
  pending_refunds_amount?: number;
}

interface PaginatedResponse {
  data: Payment[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const AdminPayments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  });
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingRefunds, setPendingRefunds] = useState<PendingRefund[]>([]);
  const [loadingRefunds, setLoadingRefunds] = useState(true);
  const [processingRefundId, setProcessingRefundId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'transactions' | 'refunds'>('transactions');
  const [selectedTransaction, setSelectedTransaction] = useState<Payment | null>(null);
  const [approveModal, setApproveModal] = useState<{ open: boolean; refund: PendingRefund | null }>({ open: false, refund: null });
  const [rejectModal, setRejectModal] = useState<{ open: boolean; refund: PendingRefund | null; reason: string }>({ open: false, refund: null, reason: '' });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadPayments();
    loadPendingRefunds();
  }, [pagination.currentPage]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await adminApi.get(`/payments?page=${pagination.currentPage}`);
      setPayments(response.data.payments?.data || response.data.data || response.data || []);
      setSummary(response.data.summary || null);
      setPagination({
        currentPage: response.data.payments?.current_page || response.data.current_page || 1,
        lastPage: response.data.payments?.last_page || response.data.last_page || 1,
        total: response.data.payments?.total || response.data.total || 0,
      });
    } catch (error) {
      console.error('Error loading payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRefunds = async () => {
    try {
      setLoadingRefunds(true);
      const response = await adminApi.get('/pending-refunds');
      setPendingRefunds(response.data.refunds || []);
    } catch (error) {
      console.error('Error loading pending refunds:', error);
      setPendingRefunds([]);
    } finally {
      setLoadingRefunds(false);
    }
  };

  const handleApproveRefund = async (appointmentId: number) => {
    try {
      setProcessingRefundId(appointmentId);
      await adminApi.post(`/refunds/${appointmentId}/approve`);
      // Reload refunds list
      await loadPendingRefunds();
      await loadPayments(); // Refresh payment stats
      setApproveModal({ open: false, refund: null });
      setSuccessMessage('Refund approved successfully! The client will receive their refund within 5-10 business days.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      console.error('Error approving refund:', error);
      alert(error.response?.data?.message || 'Failed to approve refund');
    } finally {
      setProcessingRefundId(null);
    }
  };

  const handleRejectRefund = async (appointmentId: number, reason: string) => {
    if (!reason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessingRefundId(appointmentId);
      await adminApi.post(`/refunds/${appointmentId}/reject`, { reason });
      // Reload refunds list
      await loadPendingRefunds();
      setRejectModal({ open: false, refund: null, reason: '' });
      setSuccessMessage('Refund request has been rejected. The client will be notified.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      console.error('Error rejecting refund:', error);
      alert(error.response?.data?.message || 'Failed to reject refund');
    } finally {
      setProcessingRefundId(null);
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter payments
  const filteredPayments = (payments || []).filter(payment => {
    const matchesMethod = filterMethod === 'all' || payment.payment_method === filterMethod;
    const matchesSearch =
      (payment.client_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payment.lawyer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payment.payment_reference || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMethod && matchesSearch;
  });

  const getPaymentMethodBadge = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'card':
        return 'bg-blue-100 text-blue-700';
      case 'gcash':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div>
          <div className="h-9 bg-gray-200 rounded w-52 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>

        {/* Stats Skeleton - with gradient backgrounds */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-white/30 rounded w-24 mb-2"></div>
                <div className="h-8 bg-white/30 rounded w-28"></div>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg"></div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-white/30 rounded w-28 mb-2"></div>
                <div className="h-8 bg-white/30 rounded w-24"></div>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg"></div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-white/30 rounded w-28 mb-2"></div>
                <div className="h-8 bg-white/30 rounded w-24"></div>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg"></div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="h-4 bg-gray-200 rounded w-28 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
            <div className="w-40 h-10 bg-gray-200 rounded-lg"></div>
            <div className="w-40 h-10 bg-gray-200 rounded-lg"></div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-36 mb-1"></div>
                    <div className="h-3 bg-gray-100 rounded w-48"></div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="h-5 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 bg-green-100 rounded-full w-16"></div>
                  <div className="h-6 bg-blue-100 rounded-full w-16"></div>
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
    <div className="space-y-6 overflow-y-scroll" style={{ scrollbarGutter: 'stable' }}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payments & Revenue</h1>
        <p className="text-gray-600">View all transactions and revenue reports</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ₱{summary?.total_revenue?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Platform Fee (10%)</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ₱{summary?.platform_fees?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary?.total_payments || 0}</p>
            </div>
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Card Payments</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-blue-600">{summary?.card_payments || 0}</p>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                  Card
                </span>
              </div>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">GCash Payments</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-green-600">{summary?.gcash_payments || 0}</p>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">
                  GCash
                </span>
              </div>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'transactions'
                  ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                All Transactions
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                  {summary?.total_payments || 0}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('refunds')}
              className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'refunds'
                  ? 'border-orange-500 text-orange-600 bg-orange-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pending Refunds
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  pendingRefunds.length > 0 
                    ? 'bg-orange-500 text-white animate-pulse' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {pendingRefunds.length}
                </span>
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'transactions' && (
            <>
              {/* Filters */}
              <div className="mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search by client, lawyer, or reference ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Payment Method Filter */}
                  <select
                    value={filterMethod}
                    onChange={(e) => setFilterMethod(e.target.value)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Methods</option>
                    <option value="card">Card Only</option>
                    <option value="gcash">GCash Only</option>
                  </select>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Transaction
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Lawyer
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-600">
                          <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
                          </svg>
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              Transaction #{payment.id}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.client_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {payment.lawyer_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentMethodBadge(payment.payment_method)}`}>
                              {payment.payment_method?.charAt(0).toUpperCase() + payment.payment_method?.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(payment.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => setSelectedTransaction(payment)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.lastPage > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing page {pagination.currentPage} of {pagination.lastPage}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                      disabled={pagination.currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                      disabled={pagination.currentPage === pagination.lastPage}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'refunds' && (
            <>
              {loadingRefunds ? (
                <div className="py-12 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600 mx-auto"></div>
                  <p className="mt-3 text-gray-600">Loading pending refunds...</p>
                </div>
              ) : pendingRefunds.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">All Caught Up!</h3>
                  <p className="text-gray-500">No pending refund requests to review.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRefunds.map((refund) => (
                    <div key={refund.id} className="border border-gray-200 rounded-xl p-6 hover:border-orange-200 hover:bg-orange-50/30 transition-all">
                      {/* Top Row: Client Info & Amount */}
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-orange-600 font-bold text-lg">
                              {refund.client_name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 text-lg">{refund.client_name}</span>
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>
                              <span className="text-gray-600">{refund.lawyer_name}</span>
                            </div>
                            <p className="text-sm text-gray-500">{refund.client_email}</p>
                          </div>
                        </div>
                        <div className="text-right bg-orange-50 px-4 py-2 rounded-xl border border-orange-100">
                          <p className="text-xs text-orange-600 font-medium uppercase tracking-wide">Refund Amount</p>
                          <p className="text-2xl font-bold text-orange-600">
                            ₱{Number(refund.refund_amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Appointment</p>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(refund.appointment_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-sm text-gray-600">{refund.appointment_time}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Cancelled</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDateTime(refund.cancelled_at)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Payment Method</p>
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                            refund.payment_method === 'card' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {refund.payment_method?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Reference</p>
                          <p className="text-xs font-mono text-gray-600 truncate" title={refund.payment_reference}>
                            {refund.payment_reference?.substring(0, 20)}...
                          </p>
                        </div>
                      </div>

                      {/* Reason */}
                      {refund.refund_reason && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                          <p className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">Cancellation Reason</p>
                          <p className="text-sm text-blue-900">{refund.refund_reason.replace('Appointment cancelled by client: ', '').replace('Appointment cancelled by client (less than 24 hours notice): ', '')}</p>
                        </div>
                      )}

                      {/* Warning Badge & Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md">
                          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className="text-sm text-amber-700 font-medium">
                            Cancelled less than 24 hours before appointment
                          </span>
                        </div>
                        
                        <div className="flex gap-3">
                          <button
                            onClick={() => setRejectModal({ open: true, refund, reason: '' })}
                            disabled={processingRefundId === refund.id}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => setApproveModal({ open: true, refund })}
                            disabled={processingRefundId === refund.id}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Approve Refund
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>

    {/* Transaction Details Modal */}
    {selectedTransaction && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          {/* Modal Header */}
          <div className={`px-6 py-4 ${
            selectedTransaction.payment_method === 'card' 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
              : 'bg-gradient-to-r from-green-500 to-emerald-600'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  {selectedTransaction.payment_method === 'card' ? (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Transaction #{selectedTransaction.id}</h3>
                  <p className="text-sm text-white/80">{selectedTransaction.payment_method?.toUpperCase()} Payment</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {/* Amount Breakdown */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200">
                <span className="text-sm text-gray-500">Reservation Fee</span>
                <span className="text-lg font-semibold text-gray-900">₱{selectedTransaction.amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200">
                <span className="text-sm text-gray-500">Platform Fee (10%)</span>
                <span className="text-sm font-medium text-blue-600">₱{selectedTransaction.platform_fee?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Lawyer Payout</span>
                <span className="text-sm font-medium text-green-600">₱{((selectedTransaction.amount || 0) - (selectedTransaction.platform_fee || 0)).toLocaleString()}</span>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">Payment Reference</span>
                <span className="text-sm font-mono text-gray-900 break-all text-right max-w-[200px]">
                  {selectedTransaction.payment_reference || 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">Payment Method</span>
                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                  selectedTransaction.payment_method === 'card'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {selectedTransaction.payment_method?.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">Client</span>
                <span className="text-sm font-medium text-gray-900">{selectedTransaction.client_name}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">Lawyer</span>
                <span className="text-sm font-medium text-gray-900">{selectedTransaction.lawyer_name}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">Date & Time</span>
                <span className="text-sm text-gray-900">
                  {new Date(selectedTransaction.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <button
              onClick={() => setSelectedTransaction(null)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Approve Refund Modal */}
    {approveModal.open && approveModal.refund && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Approve Refund</h3>
                <p className="text-sm text-gray-500">Confirm refund for this appointment</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-4">
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm text-gray-500">Client</p>
                  <p className="font-medium text-gray-900">{approveModal.refund.client_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="text-xl font-bold text-blue-600">
                    ₱{Number(approveModal.refund.refund_amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-500">Appointment</p>
                <p className="text-sm text-gray-900">
                  {new Date(approveModal.refund.appointment_date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })} at {approveModal.refund.appointment_time}
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> This will process the refund through PayMongo. The client will receive their refund within 5-10 business days.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
            <button
              onClick={() => setApproveModal({ open: false, refund: null })}
              disabled={processingRefundId === approveModal.refund.id}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-100 transition-colors text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleApproveRefund(approveModal.refund!.id)}
              disabled={processingRefundId === approveModal.refund.id}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processingRefundId === approveModal.refund.id ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </>
              ) : (
                'Approve Refund'
              )}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Reject Refund Modal */}
    {rejectModal.open && rejectModal.refund && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Reject Refund</h3>
                <p className="text-sm text-gray-500">Decline refund request</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-4">
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Client</p>
                  <p className="font-medium text-gray-900">{rejectModal.refund.client_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ₱{Number(rejectModal.refund.refund_amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Reason for rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectModal.reason}
                onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Please provide a reason for rejecting this refund request..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500">This reason will be sent to the client.</p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
            <button
              onClick={() => setRejectModal({ open: false, refund: null, reason: '' })}
              disabled={processingRefundId === rejectModal.refund.id}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-100 transition-colors text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleRejectRefund(rejectModal.refund!.id, rejectModal.reason)}
              disabled={processingRefundId === rejectModal.refund.id || !rejectModal.reason.trim()}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processingRefundId === rejectModal.refund.id ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </>
              ) : (
                'Reject Refund'
              )}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Success Message Toast */}
    {successMessage && (
      <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-start gap-3 max-w-md">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Success</p>
            <p className="text-sm text-gray-600">{successMessage}</p>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    )}
    </PageTransition>
  );
};

export default AdminPayments;