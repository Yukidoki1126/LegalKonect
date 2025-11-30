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
  active_lawyers: number;
  active_users: number;
  average_rating: number;
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
          <div className="h-8 bg-gray-200 rounded w-52 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>

        {/* Stats Grid Skeleton - with colored icons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-10 h-10 bg-purple-50 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-28"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
                <div className="h-3 bg-gray-100 rounded w-20"></div>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
                <div className="h-3 bg-gray-100 rounded w-24"></div>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Appointments Skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="h-5 bg-gray-200 rounded w-44 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-full"></div>
                  <div className="space-y-1.5">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-100 rounded w-24"></div>
                  </div>
                </div>
                <div className="space-y-1.5 text-right">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-5 bg-green-100 rounded-full w-16"></div>
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

      {/* Stats Grid - Modern Card Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Users */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.total_users || 0}</p>
              <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                {stats?.active_users || 0} active
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Lawyers */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Lawyers</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.total_lawyers || 0}</p>
              <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                {stats?.active_lawyers || 0} available
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Appointments */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Appointments</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.total_appointments || 0}</p>
              <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                {stats?.pending_appointments || 0} pending
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">₱{stats?.total_revenue?.toLocaleString() || 0}</p>
              <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
                <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" /></svg>
                ₱{stats?.monthly_revenue?.toLocaleString() || 0} this month
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent Appointments
          </h2>
        </div>

        {stats?.recent_appointments && stats.recent_appointments.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {stats.recent_appointments.map((appointment: any) => (
              <div key={appointment.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white font-semibold text-sm">
                      {appointment.client_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">{appointment.client_name || 'Unknown'}</p>
                    <p className="text-gray-500 text-sm">with <span className="text-blue-600 font-medium">{appointment.lawyer_name || 'Unknown Lawyer'}</span></p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <p className="text-gray-900 text-sm font-medium">
                      {new Date(appointment.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {new Date(appointment.appointment_date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    appointment.status === 'confirmed' ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20' :
                    appointment.status === 'pending' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20' :
                    appointment.status === 'cancelled' ? 'bg-red-50 text-red-600 ring-1 ring-red-600/20' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      appointment.status === 'confirmed' ? 'bg-green-500' :
                      appointment.status === 'pending' ? 'bg-amber-500' :
                      appointment.status === 'cancelled' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`}></span>
                    {appointment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No recent appointments</p>
            <p className="text-gray-400 text-sm mt-1">New bookings will appear here</p>
          </div>
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
                <p className="text-xl font-bold text-gray-900">{stats?.active_lawyers || 0}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-sm">of {stats?.total_lawyers || 0} total</p>
              </div>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <p className="text-gray-500 text-sm">Users with Appointments</p>
                <p className="text-xl font-bold text-gray-900">{stats?.active_users || 0}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-sm">of {stats?.total_users || 0} total</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Average Lawyer Rating</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats?.average_rating ? `${stats.average_rating}` : 'N/A'} 
                  {stats?.average_rating ? <span className="text-amber-400 ml-1">★</span> : null}
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-sm">from reviews</p>
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