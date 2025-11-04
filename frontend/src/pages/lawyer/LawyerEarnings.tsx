import React, { useEffect, useState } from 'react';
import { lawyerApi } from '../../services/lawyerApi';

interface MonthlyBreakdown {
  year: number;
  month: number;
  total: number;
}

interface Earnings {
  total: number;
  this_month: number;
  last_month: number;
  monthly_breakdown: MonthlyBreakdown[];
}

const LawyerEarnings: React.FC = () => {
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const data = await lawyerApi.getEarnings();
      setEarnings(data);
    } catch (err) {
      console.error('Error fetching earnings:', err);
      alert('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  };

  const calculateGrowth = (): number => {
    if (!earnings || earnings.last_month === 0) return 0;
    return parseFloat(((earnings.this_month - earnings.last_month) / earnings.last_month * 100).toFixed(1));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const growth = calculateGrowth();

  return (
    <div className="max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Earnings</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Track your consultation revenue</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 lg:mb-8">
        {/* Total Earnings */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-lg p-4 sm:p-5 md:p-6 text-white">
          <p className="text-blue-100 text-xs sm:text-sm font-medium mb-2">Total Earnings</p>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 truncate">₱{earnings?.total.toLocaleString() || 0}</p>
          <p className="text-blue-100 text-xs sm:text-sm">All-time revenue</p>
        </div>

        {/* This Month */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6">
          <p className="text-gray-600 text-xs sm:text-sm font-medium mb-2">This Month</p>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 truncate">
            ₱{earnings?.this_month.toLocaleString() || 0}
          </p>
          {growth !== 0 && (
            <div className={`flex items-center text-xs sm:text-sm ${growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {growth > 0 ? '↑' : '↓'} {Math.abs(growth)}% from last month
            </div>
          )}
        </div>

        {/* Last Month */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6">
          <p className="text-gray-600 text-xs sm:text-sm font-medium mb-2">Last Month</p>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 truncate">
            ₱{earnings?.last_month.toLocaleString() || 0}
          </p>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Monthly Breakdown</h2>
        
        {earnings?.monthly_breakdown && earnings.monthly_breakdown.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {earnings.monthly_breakdown.map((item, index) => {
              const maxAmount = Math.max(...earnings.monthly_breakdown.map(i => i.total));
              const percentage = (item.total / maxAmount) * 100;

              return (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="w-full sm:w-20 md:w-24 text-xs sm:text-sm font-medium text-gray-700">
                    {getMonthName(item.month)} {item.year}
                  </div>
                  <div className="flex-1 sm:mx-2 md:mx-4">
                    <div className="bg-gray-200 rounded-full h-7 sm:h-8 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-full flex items-center justify-end pr-2 sm:pr-3 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      >
                        {percentage > 30 && (
                          <span className="text-white text-xs sm:text-sm font-medium">
                            ₱{item.total.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="w-full sm:w-24 md:w-32 text-left sm:text-right text-base sm:text-lg font-bold text-gray-900">
                    ₱{item.total.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8 text-gray-500">
            <p className="text-sm sm:text-base">No earnings data available yet</p>
          </div>
        )}
      </div>

      {/* Info Note */}
      <div className="mt-4 sm:mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
        <p className="text-xs sm:text-sm text-blue-900">
          <strong>Note:</strong> Earnings are calculated from paid appointments that are either confirmed or completed.
          Pending payments are not included in these statistics.
        </p>
      </div>
    </div>
  );
};

export default LawyerEarnings;