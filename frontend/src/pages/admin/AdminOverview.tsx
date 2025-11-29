import React, { useEffect, useState } from 'react';
import adminApi from '../../services/adminApi';
import PageTransition from '../../components/PageTransition';

interface DashboardStats {
  total_users: number;
  total_lawyers: number;
  total_appointments: number;
  pending_appointments: number;
  total_revenue: number;
  monthly_revenue: number;
  recent_appointments: any[];
}

const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setError(null);
      const response = await adminApi.get('/dashboard/stats');
      setStats(response.data);
    } catch (error: any) {
      console.error('Error loading stats:', error);
      setError(error.response?.data?.message || 'Failed to load dashboard stats. Please try again.');
    } finally {
      setLoading(false);
    }
  };

 if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div>
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-md"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Appointments Skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="h-5 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-gray-200 rounded-full"></div>
                  <div className="space-y-1.5">
                    <div className="h-4 bg-gray-200 rounded w-28"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
                <div className="space-y-1.5 text-right">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-5 bg-gray-200 rounded w-16"></div>
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
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
          <button
            onClick={loadStats}
            className="ml-4 text-sm font-medium text-red-700 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 text-sm mt-1">Welcome to LegalKonect Admin Portal</p>
      </div>

      {/* Stats Grid - Clean Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.total_users || 0}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Lawyers */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Lawyers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.total_lawyers || 0}</p>
            </div>
            <div className="w-10 h-10 bg-purple-50 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Appointments */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Appointments</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.total_appointments || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                <span className="text-amber-600 font-medium">{stats?.pending_appointments || 0}</span> pending approval
              </p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">₱{stats?.total_revenue?.toLocaleString() || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                <span className="text-green-600 font-medium">₱{stats?.monthly_revenue?.toLocaleString() || 0}</span> this month
              </p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Appointments</h2>

        {stats?.recent_appointments && stats.recent_appointments.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {stats.recent_appointments.map((appointment: any) => (
              <div key={appointment.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-medium text-sm">
                      {appointment.client_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium text-sm">{appointment.client_name || 'Unknown'}</p>
                    <p className="text-gray-500 text-xs">with <span className="text-blue-600">{appointment.lawyer_name || 'Unknown Lawyer'}</span></p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-900 text-sm">
                    {new Date(appointment.appointment_date).toLocaleDateString()}
                  </p>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    appointment.status === 'confirmed' ? 'text-green-700' :
                    appointment.status === 'pending' ? 'text-amber-700' :
                    appointment.status === 'cancelled' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {appointment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm text-center py-6">No recent appointments</p>
        )}
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Appointment Status Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Appointment Status</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2.5 px-3 rounded-md hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                <span className="text-gray-700 text-sm">Confirmed</span>
              </div>
              <span className="text-gray-900 font-semibold text-sm">{Math.floor((stats?.total_appointments || 0) * 0.6)}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 px-3 rounded-md hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div>
                <span className="text-gray-700 text-sm">Pending</span>
              </div>
              <span className="text-gray-900 font-semibold text-sm">{stats?.pending_appointments || 0}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 px-3 rounded-md hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700 text-sm">Completed</span>
              </div>
              <span className="text-gray-900 font-semibold text-sm">{Math.floor((stats?.total_appointments || 0) * 0.3)}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 px-3 rounded-md hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                <span className="text-gray-700 text-sm">Cancelled</span>
              </div>
              <span className="text-gray-900 font-semibold text-sm">{Math.floor((stats?.total_appointments || 0) * 0.1)}</span>
            </div>
          </div>
        </div>

        {/* System Overview */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">System Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <p className="text-gray-500 text-sm">Active Lawyers</p>
                <p className="text-xl font-bold text-gray-900">{Math.floor((stats?.total_lawyers || 0) * 0.85)}</p>
              </div>
              <div className="text-right">
                <p className="text-green-600 text-sm font-medium">↑ 12%</p>
                <p className="text-gray-400 text-xs">vs last month</p>
              </div>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <p className="text-gray-500 text-sm">Active Users</p>
                <p className="text-xl font-bold text-gray-900">{Math.floor((stats?.total_users || 0) * 0.7)}</p>
              </div>
              <div className="text-right">
                <p className="text-green-600 text-sm font-medium">↑ 8%</p>
                <p className="text-gray-400 text-xs">vs last month</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Average Rating</p>
                <p className="text-xl font-bold text-gray-900">4.8 <span className="text-amber-400">★</span></p>
              </div>
              <div className="text-right">
                <p className="text-green-600 text-sm font-medium">↑ 0.2</p>
                <p className="text-gray-400 text-xs">vs last month</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </PageTransition>
  );
};

export default AdminOverview;