import { useState, useEffect } from 'react';
import { lawyerApi } from '../../services/lawyerApi';
import {
  Clock,
  CheckCircle,
  Calendar,
  User,
  CreditCard,
  RefreshCw,
  FileText,
  AlertCircle
} from 'lucide-react';

interface Transaction {
  id: number;
  appointment_id: number;
  client_name: string;
  appointment_date: string;
  consultation_fee: number;
  reservation_fee: number;
  payment_method_used: string | null;
  payment_status: string;
  payment_confirmed: boolean;
  payment_confirmed_at: string | null;
  completed_at: string | null;
  status: string;
}

interface TransactionSummary {
  total_appointments: number;
  confirmed_payments: number;
  total_completed: number;
  pending_confirmation: number;
}

export default function LawyerTransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending'>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  useEffect(() => {
    fetchTransactions();
  }, [dateFilter]);

  const fetchTransactions = async (isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
    }
    setError('');
    try {
      const response = await lawyerApi.getTransactionHistory(1, dateFilter || undefined);
      setTransactions(response.transactions || []);
      setSummary(response.summary || null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transaction history';
      setError(errorMessage);
    } finally {
      if (!isRefresh) {
        setLoading(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'confirmed') return t.payment_confirmed;
    if (filter === 'pending') return !t.payment_confirmed && t.payment_status === 'pending';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
            <p className="text-gray-600 mt-1">View your completed consultations and payments</p>
          </div>
          <button
            onClick={() => fetchTransactions(true)}
            className="mt-3 md:mt-0 flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Appointments</p>
                  <p className="text-xl font-bold text-gray-900">{summary.total_appointments ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Confirmed Payments</p>
                  <p className="text-xl font-bold text-gray-900">{summary.confirmed_payments ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Completed Sessions</p>
                  <p className="text-xl font-bold text-gray-900">{summary.total_completed ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pending Confirmation</p>
                  <p className="text-xl font-bold text-gray-900">{summary.pending_confirmation ?? 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Note about manual payments */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-900 font-medium">Payment Information</p>
              <p className="text-sm text-blue-800 mt-1">
                Payments are received directly to your GCash or bank account. After a client uploads their payment receipt, 
                you can confirm the payment from the Appointments page. This page shows your confirmed transaction history.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Status Filter */}
          <div className="flex gap-2 overflow-x-auto">
            {[
              { key: 'all', label: 'All Transactions' },
              { key: 'confirmed', label: 'Confirmed' },
              { key: 'pending', label: 'Pending' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as typeof filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Date Range Filter */}
          <div className="flex gap-2 overflow-x-auto">
            {[
              { key: '', label: 'All Time' },
              { key: '7days', label: 'Last 7 Days' },
              { key: '1month', label: 'Last Month' },
              { key: '3months', label: 'Last 3 Months' },
              { key: '1year', label: 'Last Year' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setDateFilter(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  dateFilter === key
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No transactions found</h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? "You don't have any completed consultations yet." 
                : `No ${filter} transactions to display.`}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Client</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Reservation Fee</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Method</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Payment Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Confirmed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gray-100 rounded-full">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                          <span className="font-medium text-gray-900">{transaction.client_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-600">{formatDate(transaction.appointment_date)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-900">₱{(transaction.reservation_fee || 100).toLocaleString()}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-600 capitalize">{transaction.payment_method_used || 'N/A'}</span>
                      </td>
                      <td className="py-3 px-4">
                        {transaction.payment_confirmed ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Confirmed
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                            Pending Confirmation
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {transaction.payment_confirmed && transaction.payment_confirmed_at ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs">{formatDateTime(transaction.payment_confirmed_at)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
