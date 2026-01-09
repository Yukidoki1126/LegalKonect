import React, { useEffect, useState, useRef } from 'react';
import { lawyerApi } from '../../services/lawyerApi';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Calendar, 
  CheckCircle2, 
  Star, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  User,
  DollarSign
} from 'lucide-react';

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
        {/* Header Skeleton - Transparent style */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2.5 bg-gray-200 rounded-xl w-11 h-11"></div>
                <div className="h-8 bg-gray-200 rounded-lg w-64"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-48 ml-14"></div>
            </div>
            <div className="h-11 w-32 bg-gray-200 rounded-xl"></div>
          </div>
        </div>

        {/* Stats Grid Skeleton - Enhanced cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border-2 border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 bg-gray-200 rounded-xl"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="h-9 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          ))}
        </div>

        {/* Earnings Skeleton - Gradient cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 bg-white/30 rounded"></div>
                <div className="h-3 bg-white/30 rounded w-28"></div>
              </div>
              <div className="h-10 bg-white/30 rounded w-40 mb-1"></div>
              <div className="h-4 bg-white/30 rounded w-24"></div>
            </div>
          </div>
          <div className="relative bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 bg-white/30 rounded"></div>
                <div className="h-3 bg-white/30 rounded w-24"></div>
              </div>
              <div className="h-10 bg-white/30 rounded w-32 mb-1"></div>
              <div className="h-4 bg-white/30 rounded w-28"></div>
            </div>
          </div>
        </div>

        {/* Today's Schedule & Recent Activity Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gray-200 rounded-lg w-8 h-8"></div>
                <div className="h-5 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded-full w-24"></div>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-gray-200 rounded-lg w-8 h-8"></div>
              <div className="h-5 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-40 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-28"></div>
                  </div>
                </div>
              ))}
            </div>
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
    {/* Header - Clean transparent style */}
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Welcome back, {lawyer?.first_name}
            </h1>
          </div>
          <p className="text-gray-500 ml-14">Here's your practice overview</p>
        </div>

        {/* Availability Toggle - Enhanced */}
        <button
          onClick={handleToggleAvailability}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm border-2 ${
            lawyer?.is_available
              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
          }`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${lawyer?.is_available ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
          {lawyer?.is_available ? 'Available' : 'Unavailable'}
        </button>
      </div>
    </div>

    {/* Stats Grid - Enhanced with gradients */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Active Cases */}
      <div className="group bg-white rounded-2xl border-2 border-gray-100 p-5 hover:shadow-lg hover:border-orange-200 transition-all duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl shadow-lg shadow-orange-200/50">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active Cases</span>
        </div>
        <p className="text-3xl font-bold text-gray-900 mb-2">{stats?.active_cases_count || 0}</p>
        <button
          onClick={() => navigate('/lawyer/cases')}
          className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 group-hover:gap-2 transition-all"
        >
          View all <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Upcoming Appointments */}
      <div className="group bg-white rounded-2xl border-2 border-gray-100 p-5 hover:shadow-lg hover:border-blue-200 transition-all duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg shadow-blue-200/50">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Upcoming</span>
        </div>
        <p className="text-3xl font-bold text-gray-900 mb-2">{stats?.upcoming_count || 0}</p>
        <button
          onClick={() => navigate('/lawyer/appointments?status=confirmed')}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 group-hover:gap-2 transition-all"
        >
          View schedule <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Completed */}
      <div className="group bg-white rounded-2xl border-2 border-gray-100 p-5 hover:shadow-lg hover:border-green-200 transition-all duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-lg shadow-green-200/50">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Completed</span>
        </div>
        <p className="text-3xl font-bold text-gray-900 mb-2">{stats?.completed_count || 0}</p>
        <span className="text-sm text-gray-500">Sessions done</span>
      </div>

      {/* Rating */}
      <div className="group bg-white rounded-2xl border-2 border-gray-100 p-5 hover:shadow-lg hover:border-yellow-200 transition-all duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl shadow-lg shadow-yellow-200/50">
            <Star className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rating</span>
        </div>
        <div className="flex items-baseline gap-1.5 mb-2">
          <p className="text-3xl font-bold text-gray-900">
            {stats?.average_rating ? Number(stats.average_rating).toFixed(1) : '0.0'}
          </p>
          <span className="text-sm text-gray-400 font-medium">/ 5</span>
        </div>
        <span className="text-sm text-gray-500">{stats?.total_reviews || 0} reviews</span>
      </div>
    </div>

    {/* Earnings Section - Enhanced */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      {/* Total Earnings */}
      <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl font-bold text-emerald-100">₱</span>
            <p className="text-sm font-semibold text-emerald-100 uppercase tracking-wide">Total Earnings</p>
          </div>
          <p className="text-4xl font-bold text-white mb-1">₱{stats?.total_earnings?.toLocaleString() || '0.00'}</p>
          <p className="text-emerald-100">All-time revenue</p>
        </div>
      </div>

      {/* This Month */}
      <div className="relative bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-violet-100" />
            <p className="text-sm font-semibold text-violet-100 uppercase tracking-wide">This Month</p>
          </div>
          <p className="text-4xl font-bold text-white mb-1">₱{stats?.this_month_earnings?.toLocaleString() || '0.00'}</p>
          <p className="text-violet-100">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>
    </div>

    {/* Today's Schedule & Recent Activity */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      {/* Today's Schedule */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Today's Schedule</h3>
          </div>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
        
        {todayAppointments.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm text-gray-500 mb-2">No appointments today</p>
            <button 
              onClick={() => navigate('/lawyer/appointments')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all appointments →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {todayAppointments.map((apt) => (
              <div key={apt.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors group">
                <div className="flex-shrink-0 w-14 text-center bg-white rounded-lg py-1.5 border border-gray-200">
                  <p className="text-sm font-bold text-gray-900">
                    {apt.start_time?.slice(0, 5)}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{apt.client_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{apt.consultation_type || 'Consultation'}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  apt.status === 'confirmed' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {apt.status}
                </span>
              </div>
            ))}
            {todayAppointments.length > 0 && (
              <button 
                onClick={() => navigate('/lawyer/appointments')}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium pt-3 border-t border-gray-100 flex items-center justify-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <button 
            onClick={() => navigate('/lawyer/appointments')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all
          </button>
        </div>
        
        {recentActivity.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm text-gray-500">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`flex-shrink-0 w-2.5 h-2.5 mt-1.5 rounded-full ${
                  activity.status === 'completed' ? 'bg-green-500' :
                  activity.status === 'confirmed' ? 'bg-blue-500' :
                  activity.status === 'pending' ? 'bg-yellow-500' :
                  activity.status === 'cancelled' || activity.status === 'declined' ? 'bg-red-500' :
                  'bg-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">{activity.client_name}</span>
                    {' '}<span className="text-gray-400">•</span>{' '}
                    <span className="text-gray-600">{activity.action}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{activity.created_at}</span>
                    {activity.amount > 0 && (
                      <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">₱{activity.amount}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* Recent Reviews Section - Enhanced */}
    {recentReviews.length > 0 && (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Star className="w-4 h-4 text-yellow-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Recent Reviews</h2>
          </div>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{stats?.total_reviews || 0} total</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentReviews.slice(0, 3).map((review) => (
            <div key={review.id} className="bg-white rounded-2xl border-2 border-gray-100 p-5 hover:shadow-lg hover:border-yellow-200 transition-all duration-300">
              {/* Star Rating */}
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                  />
                ))}
                <span className="ml-2 text-sm font-semibold text-gray-700">{review.rating}.0</span>
              </div>

              {/* Comment */}
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{review.comment || 'No comment provided'}</p>

              {/* Client Info */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {review.client_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{review.client_name}</span>
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