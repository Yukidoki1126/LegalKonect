import React, { useEffect, useState, useRef } from 'react';
import { lawyerApi } from '../../services/lawyerApi';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  active_cases_count: number;
  upcoming_count: number;
  completed_count: number;
  total_earnings: number;
  this_month_earnings: number;
  average_rating: number;
  total_reviews: number;
}

interface Review {
  id: number;
  rating: number;
  comment: string;
  client_name: string;
  created_at: string;
}

interface LawyerInfo {
  id: number;
  first_name: string;
  last_name: string;
  is_available: boolean;
}

const LawyerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lawyer, setLawyer] = useState<LawyerInfo | null>(null);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fetchingRef = useRef(false);
  const lastFetchRef = useRef(0);
  const initialLoadRef = useRef(false);

  useEffect(() => {
    // Show loading only if data isn't returned within 200ms
    const loadingTimeout = setTimeout(() => {
      if (!initialLoadRef.current) {
        setLoading(true);
      }
    }, 200);

    fetchDashboardData(false).finally(() => {
      initialLoadRef.current = true;
      clearTimeout(loadingTimeout);
      setLoading(false);
    });

    return () => clearTimeout(loadingTimeout);
  }, []);

  // Auto-refresh dashboard stats every 60 seconds (reduced from 20 seconds)
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Only refresh if user is on the page (tab is visible)
      if (!document.hidden) {
        fetchDashboardData(false); // Silent refresh
      }
    }, 60000); // 60 seconds

    return () => clearInterval(intervalId);
  }, []);

  const fetchDashboardData = async (showLoading = false) => {
    // Prevent duplicate fetches
    if (fetchingRef.current) return;

    // Throttle requests - don't fetch if last fetch was less than 5 seconds ago
    const now = Date.now();
    if (now - lastFetchRef.current < 5000 && !showLoading) {
      return;
    }

    try {
      fetchingRef.current = true;
      lastFetchRef.current = now;
      if (showLoading) setLoading(true);

      const data = await lawyerApi.getDashboard();
      setStats(data.stats);
      setLawyer(data.lawyer);
      setRecentReviews(data.recent_reviews || []);
    } catch (err: any) {
      console.error('Error fetching dashboard:', err);
      if (err.response?.status === 403) {
        setError('You do not have lawyer access. Please contact support.');
      } else if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Failed to load dashboard data');
      }
    } finally {
      fetchingRef.current = false;
      if (showLoading) setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    try {
      const result = await lawyerApi.toggleAvailability();
      setLawyer(prev => prev ? { ...prev, is_available: result.is_available } : null);
    } catch (err) {
      console.error('Error toggling availability:', err);
      alert('Failed to update availability');
    }
  };

  // Show skeleton if loading OR if data hasn't loaded yet
  if (loading || !stats) {
    return (
      <div className="max-w-full overflow-x-hidden animate-pulse">
        {/* Header Skeleton */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <div className="h-10 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-12 w-32 bg-gray-200 rounded-lg"></div>
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>

        {/* Total Earnings Skeleton */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-8 mb-8">
          <div className="h-4 bg-blue-400 bg-opacity-50 rounded w-32 mb-2"></div>
          <div className="h-12 bg-blue-400 bg-opacity-50 rounded w-48 mb-2"></div>
          <div className="h-4 bg-blue-400 bg-opacity-50 rounded w-64"></div>
        </div>

        {/* Quick Actions Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
  <div className="max-w-full overflow-x-hidden animate-fadeIn">
    {/* Header */}
    <div className="mb-6 lg:mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Welcome back, {lawyer?.first_name} {lawyer?.last_name}
          </h1>
          <p className="text-gray-600 mt-2">Here's your practice overview</p>
        </div>

        {/* Availability Toggle */}
        <button
          onClick={handleToggleAvailability}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            lawyer?.is_available
              ? 'bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100'
              : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100'
          }`}
        >
          <span className={`w-3 h-3 rounded-full ${lawyer?.is_available ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          {lawyer?.is_available ? 'Available' : 'Unavailable'}
        </button>
      </div>
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Active Cases */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-orange-50 rounded-lg">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
        <p className="text-sm font-medium text-gray-600 mb-1">ACTIVE CASES</p>
        <p className="text-3xl font-bold text-gray-900 mb-4">
          {stats?.active_cases_count || 0}
        </p>
        <button
          onClick={() => navigate('/lawyer/cases')}
          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          Manage cases →
        </button>
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <p className="text-sm font-medium text-gray-600 mb-1">UPCOMING</p>
        <p className="text-3xl font-bold text-gray-900 mb-4">
          {stats?.upcoming_count || 0}
        </p>
        <button
          onClick={() => navigate('/lawyer/appointments?status=confirmed')}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View schedule →
        </button>
      </div>

      {/* Completed */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-green-50 rounded-lg">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <p className="text-sm font-medium text-gray-600 mb-1">COMPLETED</p>
        <p className="text-3xl font-bold text-gray-900 mb-4">
          {stats?.completed_count || 0}
        </p>
        <p className="text-sm text-gray-500">Total sessions completed</p>
      </div>

      {/* Client Reviews */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-yellow-50 rounded-lg">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
        </div>
        <p className="text-sm font-medium text-gray-600 mb-1">CLIENT REVIEWS</p>
        <div className="flex items-baseline gap-2 mb-4">
          <p className="text-3xl font-bold text-gray-900">
            {stats?.average_rating ? Number(stats.average_rating).toFixed(1) : '0.0'}
          </p>
          <p className="text-sm text-gray-600">★</p>
        </div>
        <p className="text-sm text-gray-500">{stats?.total_reviews || 0} total reviews</p>
      </div>
    </div>

    {/* Total Earnings Card */}
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 mb-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium mb-2">TOTAL EARNINGS</p>
          <p className="text-5xl font-bold text-white mb-2">₱{stats?.total_earnings?.toLocaleString() || 0}</p>
          <p className="text-gray-400">All-time revenue from completed consultations</p>
        </div>
        <div className="hidden md:block">
          <svg className="w-20 h-20 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    </div>

    {/* Recent Reviews Section */}
    {recentReviews.length > 0 && (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Client Reviews</h2>
          <span className="text-sm text-gray-500">{stats?.total_reviews || 0} total</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              {/* Star Rating */}
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-5 h-5 ${
                      star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                ))}
                <span className="text-sm text-gray-600 ml-1">({review.rating}.0)</span>
              </div>

              {/* Comment */}
              <p className="text-gray-700 text-sm mb-4 line-clamp-3">{review.comment}</p>

              {/* Client Info */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">
                      {review.client_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{review.client_name}</span>
                </div>
                <span className="text-xs text-gray-500">{review.created_at}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

  </div>
);
};

export default LawyerDashboard;