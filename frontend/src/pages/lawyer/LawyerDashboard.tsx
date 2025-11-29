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

interface TodayAppointment {
  id: number;
  client_name: string;
  client_photo: string | null;
  start_time: string;
  end_time: string;
  status: string;
  consultation_type: string;
}

interface RecentActivity {
  id: number;
  action: string;
  client_name: string;
  status: string;
  appointment_date: string;
  created_at: string;
  amount: number;
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
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fetchingRef = useRef(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-refresh dashboard stats every 60 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!document.hidden) {
        fetchDashboardData();
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const fetchDashboardData = async () => {
    if (fetchingRef.current) return;

    try {
      fetchingRef.current = true;
      const data = await lawyerApi.getDashboard();
      setStats(data.stats);
      setLawyer(data.lawyer);
      setRecentReviews(data.recent_reviews || []);
      setTodayAppointments(data.today_appointments || []);
      setRecentActivity(data.recent_activity || []);
      setError('');
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
      setLoading(false);
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

  // Show skeleton only during initial loading
  if (loading) {
    return (
      <div className="max-w-full overflow-x-hidden animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="h-7 bg-gray-200 rounded w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-40"></div>
          </div>
          <div className="h-9 w-28 bg-gray-200 rounded-md"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-7 bg-gray-200 rounded w-12 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>

        {/* Earnings Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-900 rounded-lg p-5">
            <div className="h-3 bg-gray-700 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-700 rounded w-40 mb-1"></div>
            <div className="h-3 bg-gray-700 rounded w-28"></div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-40 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-28"></div>
          </div>
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
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, {lawyer?.first_name}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Here's your practice overview</p>
      </div>

      {/* Availability Toggle */}
      <button
        onClick={handleToggleAvailability}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          lawyer?.is_available
            ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
            : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${lawyer?.is_available ? 'bg-green-500' : 'bg-gray-400'}`}></span>
        {lawyer?.is_available ? 'Available' : 'Unavailable'}
      </button>
    </div>

    {/* Stats Grid - 2x2 on mobile, 4 cols on desktop */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Active Cases */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-orange-50 rounded-md">
            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-xs font-medium text-gray-500 uppercase">Active Cases</span>
        </div>
        <p className="text-2xl font-bold text-gray-900 mb-2">{stats?.active_cases_count || 0}</p>
        <button
          onClick={() => navigate('/lawyer/cases')}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          View all →
        </button>
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-50 rounded-md">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-xs font-medium text-gray-500 uppercase">Upcoming</span>
        </div>
        <p className="text-2xl font-bold text-gray-900 mb-2">{stats?.upcoming_count || 0}</p>
        <button
          onClick={() => navigate('/lawyer/appointments?status=confirmed')}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          View schedule →
        </button>
      </div>

      {/* Completed */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-green-50 rounded-md">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xs font-medium text-gray-500 uppercase">Completed</span>
        </div>
        <p className="text-2xl font-bold text-gray-900 mb-2">{stats?.completed_count || 0}</p>
        <span className="text-xs text-gray-500">Sessions done</span>
      </div>

      {/* Rating */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-yellow-50 rounded-md">
            <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <span className="text-xs font-medium text-gray-500 uppercase">Rating</span>
        </div>
        <div className="flex items-baseline gap-1 mb-2">
          <p className="text-2xl font-bold text-gray-900">
            {stats?.average_rating ? Number(stats.average_rating).toFixed(1) : '0.0'}
          </p>
          <span className="text-sm text-gray-400">/ 5</span>
        </div>
        <span className="text-xs text-gray-500">{stats?.total_reviews || 0} reviews</span>
      </div>
    </div>

    {/* Earnings Section */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      {/* Total Earnings */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Total Earnings</p>
        <p className="text-3xl font-bold text-gray-900">₱{stats?.total_earnings?.toLocaleString() || '0.00'}</p>
        <p className="text-sm text-gray-500 mt-1">All-time revenue</p>
      </div>

      {/* This Month */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <p className="text-xs font-medium text-gray-500 uppercase mb-1">This Month</p>
        <p className="text-3xl font-bold text-gray-900">₱{stats?.this_month_earnings?.toLocaleString() || '0.00'}</p>
        <p className="text-sm text-gray-500 mt-1">November 2025</p>
      </div>
    </div>

    {/* Today's Schedule & Recent Activity */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      {/* Today's Schedule */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Today's Schedule</h3>
          <span className="text-xs text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
        
        {todayAppointments.length === 0 ? (
          <div className="text-center py-6">
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-500">No appointments today</p>
            <button 
              onClick={() => navigate('/lawyer/appointments')}
              className="text-xs text-blue-600 hover:text-blue-700 mt-1"
            >
              View all appointments →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {todayAppointments.map((apt) => (
              <div key={apt.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 w-12 text-center">
                  <p className="text-sm font-medium text-gray-900">
                    {apt.start_time?.slice(0, 5)}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{apt.client_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{apt.consultation_type || 'Consultation'}</p>
                </div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  apt.status === 'confirmed' 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-yellow-50 text-yellow-700'
                }`}>
                  {apt.status}
                </span>
              </div>
            ))}
            {todayAppointments.length > 0 && (
              <button 
                onClick={() => navigate('/lawyer/appointments')}
                className="w-full text-center text-xs text-blue-600 hover:text-blue-700 pt-2 border-t border-gray-100"
              >
                View all →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
          <button 
            onClick={() => navigate('/lawyer/appointments')}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            View all
          </button>
        </div>
        
        {recentActivity.length === 0 ? (
          <div className="text-center py-6">
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-500">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-2 h-2 mt-1.5 rounded-full ${
                  activity.status === 'completed' ? 'bg-green-500' :
                  activity.status === 'confirmed' ? 'bg-blue-500' :
                  activity.status === 'pending' ? 'bg-yellow-500' :
                  activity.status === 'cancelled' || activity.status === 'declined' ? 'bg-red-500' :
                  'bg-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.client_name}</span>
                    {' '}<span className="text-gray-500">-</span>{' '}
                    <span className="text-gray-600">{activity.action}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{activity.created_at}</span>
                    {activity.amount > 0 && (
                      <span className="text-xs text-green-600 font-medium">₱{activity.amount}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* Recent Reviews Section */}
    {recentReviews.length > 0 && (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Reviews</h2>
          <span className="text-sm text-gray-500">{stats?.total_reviews || 0} total</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentReviews.slice(0, 3).map((review) => (
            <div key={review.id} className="bg-white rounded-lg border border-gray-200 p-4">
              {/* Star Rating */}
              <div className="flex items-center gap-0.5 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`}
                    viewBox="0 0 24 24"
                  >
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                ))}
              </div>

              {/* Comment */}
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{review.comment || 'No comment provided'}</p>

              {/* Client Info */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">
                      {review.client_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700">{review.client_name}</span>
                </div>
                <span className="text-xs text-gray-400">{review.created_at}</span>
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