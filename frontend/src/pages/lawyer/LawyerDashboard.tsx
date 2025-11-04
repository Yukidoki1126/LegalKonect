import React, { useEffect, useState, useRef } from 'react';
import { lawyerApi } from '../../services/lawyerApi';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  pending_count: number;
  upcoming_count: number;
  completed_count: number;
  total_earnings: number;
  this_month_earnings: number;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fetchingRef = useRef(false);
  const lastFetchRef = useRef(0);

  useEffect(() => {
    fetchDashboardData(true);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
  <div className="max-w-full overflow-x-hidden">
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
      {/* Pending Appointments */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-orange-50 rounded-lg">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <p className="text-sm font-medium text-gray-600 mb-1">PENDING REQUESTS</p>
        <p className="text-3xl font-bold text-gray-900 mb-4">
          {stats?.pending_count || 0}
        </p>
        <button
          onClick={() => navigate('/lawyer/appointments?status=pending')}
          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          Review requests →
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

      {/* This Month Earnings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-indigo-50 rounded-lg">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <p className="text-sm font-medium text-gray-600 mb-1">THIS MONTH</p>
        <p className="text-3xl font-bold text-gray-900 mb-4">
          ₱{stats?.this_month_earnings?.toLocaleString() || 0}
        </p>
        <button
          onClick={() => navigate('/lawyer/earnings')}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          View details →
        </button>
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

    {/* Quick Actions */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <button
        onClick={() => navigate('/lawyer/appointments?status=pending')}
        className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all group"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <h3 className="font-bold text-gray-900 text-lg mb-2">Review Pending</h3>
        <p className="text-gray-600 text-sm">Accept or decline appointment requests</p>
      </button>

      <button
        onClick={() => navigate('/lawyer/appointments')}
        className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all group"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <h3 className="font-bold text-gray-900 text-lg mb-2">View Schedule</h3>
        <p className="text-gray-600 text-sm">Check your upcoming appointments</p>
      </button>

      <button
        onClick={() => navigate('/lawyer/cases')}
        className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all group"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <h3 className="font-bold text-gray-900 text-lg mb-2">Manage Cases</h3>
        <p className="text-gray-600 text-sm">Create and track client cases</p>
      </button>

      <button
        onClick={() => navigate('/lawyer/earnings')}
        className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all group"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <h3 className="font-bold text-gray-900 text-lg mb-2">Earnings Report</h3>
        <p className="text-gray-600 text-sm">View detailed revenue breakdown</p>
      </button>
    </div>
  </div>
);
};

export default LawyerDashboard;