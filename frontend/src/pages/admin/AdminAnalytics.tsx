import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Clock, DollarSign, Star, Calendar, BarChart3, PieChart, AlertCircle } from 'lucide-react';
import adminApi from '../../services/adminApi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PageTransition from '../../components/PageTransition';

interface AnalyticsData {
  revenue: {
    daily: Array<{ date: string; amount: number }>;
    total: number;
  };
  appointments: {
    total: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    pending: number;
  };
  lawyers: {
    total: number;
    active: number;
    approved: number;
    pending: number;
  };
  users: {
    total: number;
    new_this_month: number;
  };
}

interface DescriptiveAnalytics {
  top_specializations: { name: string; appointment_count: number }[];
  appointment_trends: { date: string; total: number; confirmed: number; completed: number; cancelled: number }[];
  peak_hours: { hour: number; count: number }[];
  top_lawyers: any[];
  meeting_types: { meeting_type: string; count: number }[];
  avg_fee_by_specialization: any[];
  retention_rate: number;
  total_clients: number;
  repeat_clients: number;
  cancellation_reasons: { cancellation_reason: string; count: number }[];
  avg_response_time_minutes: number;
  period_days: number;
}

const AdminAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [descriptive, setDescriptive] = useState<DescriptiveAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [activeTab, setActiveTab] = useState<'overview' | 'descriptive'>('overview');

  useEffect(() => {
    loadAnalytics();
  }, []);

 useEffect(() => {
  if (activeTab === 'descriptive') {
    loadDescriptiveAnalytics();
  }
}, [activeTab, period]);

  const loadAnalytics = async () => {
  try {
    setLoading(true);
    const response = await adminApi.get('/analytics', {
      headers: { 'Cache-Control': 'no-cache' }
    });
    setAnalytics(response.data);
  } catch (error) {
    console.error('Error loading analytics:', error);
  } finally {
    setLoading(false);
  }
};

const loadDescriptiveAnalytics = async () => {
  try {
    setLoading(true);
    const response = await adminApi.get(`/descriptive-analytics?days=${period}`, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    setDescriptive(response.data);
  } catch (error) {
    console.error('Error loading descriptive analytics:', error);
    setDescriptive({
      top_specializations: [],
      appointment_trends: [],
      peak_hours: [],
      top_lawyers: [],
      meeting_types: [],
      avg_fee_by_specialization: [],
      retention_rate: 0,
      total_clients: 0,
      repeat_clients: 0,
      cancellation_reasons: [],
      avg_response_time_minutes: 0,
      period_days: period
    });
  } finally {
    setLoading(false);
  }
};

  if (loading && !analytics && !descriptive) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg p-6 h-32 border border-gray-200 shadow-sm"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights and performance metrics</p>
        </div>

        {activeTab === 'descriptive' && (
          <select
            value={period}
            onChange={(e) => {
              setPeriod(Number(e.target.value));
              setDescriptive(null); // Force reload
            }}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
            <option value={365}>Last Year</option>
          </select>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 rounded-lg font-medium transition ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Overview Analytics
        </button>
        <button
          onClick={() => setActiveTab('descriptive')}
          className={`px-6 py-3 rounded-lg font-medium transition ${
            activeTab === 'descriptive'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Descriptive Analytics
        </button>
      </div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && analytics && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold text-white">₱{analytics.revenue.total.toLocaleString()}</p>
                </div>
                <DollarSign className="w-12 h-12 text-white/80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Total Appointments</p>
                  <p className="text-3xl font-bold text-white">{analytics.appointments.total}</p>
                  <p className="text-blue-100 text-xs mt-1">{analytics.appointments.completed} completed</p>
                </div>
                <Calendar className="w-12 h-12 text-white/80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-1">Active Lawyers</p>
                  <p className="text-3xl font-bold text-white">{analytics.lawyers.active}</p>
                  <p className="text-purple-100 text-xs mt-1">{analytics.lawyers.total} total</p>
                </div>
                <Users className="w-12 h-12 text-white/80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-sm font-medium mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-white">{analytics.users.total}</p>
                  <p className="text-pink-100 text-xs mt-1">{analytics.users.new_this_month} this month</p>
                </div>
                <Users className="w-12 h-12 text-white/80" />
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.revenue.daily}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  labelStyle={{ color: '#111827' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Appointment Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Completed</span>
                  <span className="text-green-600 font-bold">{analytics.appointments.completed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Confirmed</span>
                  <span className="text-blue-600 font-bold">{analytics.appointments.confirmed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Pending</span>
                  <span className="text-yellow-600 font-bold">{analytics.appointments.pending}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Cancelled</span>
                  <span className="text-red-600 font-bold">{analytics.appointments.cancelled}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Lawyer Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Approved</span>
                  <span className="text-green-600 font-bold">{analytics.lawyers.approved}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Active</span>
                  <span className="text-blue-600 font-bold">{analytics.lawyers.active}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Pending Approval</span>
                  <span className="text-yellow-600 font-bold">{analytics.lawyers.pending}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Total</span>
                  <span className="text-blue-600 font-bold">{analytics.lawyers.total}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Descriptive Tab Content */}
      {activeTab === 'descriptive' && (
        <>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading analytics...</p>
            </div>
          ) : descriptive ? (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-purple-100 text-sm font-medium mb-1">Client Retention</p>
                      <p className="text-3xl font-bold text-white break-words">{descriptive.retention_rate.toLocaleString()}%</p>
                      <p className="text-purple-100 text-xs mt-1">{descriptive.repeat_clients.toLocaleString()} repeat clients</p>
                    </div>
                    <Users className="w-12 h-12 text-white/80 flex-shrink-0" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-blue-100 text-sm font-medium mb-1">Avg Response Time</p>
                      <p className="text-3xl font-bold text-white break-words">{descriptive.avg_response_time_minutes.toLocaleString()}</p>
                      <p className="text-blue-100 text-xs mt-1">minutes</p>
                    </div>
                    <Clock className="w-12 h-12 text-white/80 flex-shrink-0" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-green-100 text-sm font-medium mb-1">Total Clients</p>
                      <p className="text-3xl font-bold text-white break-words">{descriptive.total_clients.toLocaleString()}</p>
                      <p className="text-green-100 text-xs mt-1">in this period</p>
                    </div>
                    <Users className="w-12 h-12 text-white/80 flex-shrink-0" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-orange-100 text-sm font-medium mb-1">Appointments</p>
                      <p className="text-3xl font-bold text-white break-words">
                        {Number(descriptive.appointment_trends.reduce((sum, t) => sum + t.total, 0)).toLocaleString('en-US')}
                      </p>
                      <p className="text-orange-100 text-xs mt-1">total bookings</p>
                    </div>
                    <Calendar className="w-12 h-12 text-white/80 flex-shrink-0" />
                  </div>
                </div>
              </div>

              {/* Top Specializations */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-3 mb-6">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                  <h3 className="text-xl font-bold text-gray-900">Most Requested Legal Expertise</h3>
                </div>
                <div className="space-y-4">
                  {descriptive.top_specializations.map((spec, index) => {
                    const maxCount = descriptive.top_specializations[0]?.appointment_count || 1;
                    const percentage = (spec.appointment_count / maxCount) * 100;

                    return (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-900 font-medium">#{index + 1} {spec.name}</span>
                          <span className="text-purple-600 font-bold">{spec.appointment_count} appointments</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Appointment Trends */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-3 mb-6">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-900">Appointment Trends Over Time</h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={descriptive.appointment_trends}>
                    <defs>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorConfirmed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCancelled" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      stroke="#6b7280"
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      labelStyle={{ color: '#111827' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="completed" stackId="1" stroke="#10b981" fill="url(#colorCompleted)" name="Completed" />
                    <Area type="monotone" dataKey="confirmed" stackId="1" stroke="#3b82f6" fill="url(#colorConfirmed)" name="Confirmed" />
                    <Area type="monotone" dataKey="cancelled" stackId="1" stroke="#ef4444" fill="url(#colorCancelled)" name="Cancelled" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Peak Hours */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3 mb-6">
                    <Clock className="w-6 h-6 text-orange-600" />
                    <h3 className="text-xl font-bold text-gray-900">Peak Booking Hours</h3>
                  </div>
                  <div className="space-y-3">
                    {descriptive.peak_hours.map((hour, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-900">
                          {String(hour.hour).padStart(2, '0')}:00 - {String(Number(hour.hour) + 1).padStart(2, '0')}:00
                        </span>
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-bold">
                          {Number(hour.count)} bookings
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Meeting Types */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3 mb-6">
                    <PieChart className="w-6 h-6 text-green-600" />
                    <h3 className="text-xl font-bold text-gray-900">Meeting Type Preferences</h3>
                  </div>
                  <div className="space-y-3">
                    {descriptive.meeting_types.map((type, index) => {
                      const total = descriptive.meeting_types.reduce((sum, t) => sum + t.count, 0);
                      const percentage = ((type.count / total) * 100).toFixed(1);

                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="text-gray-900 capitalize">{type.meeting_type || 'Not specified'}</span>
                            <p className="text-gray-600 text-sm">{percentage}% of total</p>
                          </div>
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                            {type.count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Fee Table */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-3 mb-6">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                  <h3 className="text-xl font-bold text-gray-900">Average Consultation Fee by Specialization</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">Specialization</th>
                        <th className="text-right py-3 px-4 text-gray-600 text-sm font-medium">Average</th>
                        <th className="text-right py-3 px-4 text-gray-600 text-sm font-medium">Min</th>
                        <th className="text-right py-3 px-4 text-gray-600 text-sm font-medium">Max</th>
                      </tr>
                    </thead>
                    <tbody>
                      {descriptive.avg_fee_by_specialization.map((spec, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition">
                          <td className="py-3 px-4 text-gray-900">{spec.name}</td>
                          <td className="py-3 px-4 text-right text-yellow-700 font-bold">
                            ₱{Number(spec.avg_fee).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600">
                            ₱{Number(spec.min_fee).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600">
                            ₱{Number(spec.max_fee).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Lawyers */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-3 mb-6">
                  <Star className="w-6 h-6 text-yellow-600" />
                  <h3 className="text-xl font-bold text-gray-900">Top Performing Lawyers</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">Lawyer</th>
                        <th className="text-right py-3 px-4 text-gray-600 text-sm font-medium">Total</th>
                        <th className="text-right py-3 px-4 text-gray-600 text-sm font-medium">Completed</th>
                        <th className="text-right py-3 px-4 text-gray-600 text-sm font-medium">Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {descriptive.top_lawyers.map((lawyer, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-purple-600 font-bold">#{index + 1}</span>
                              <span className="text-gray-900">
                                {lawyer.first_name} {lawyer.last_name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right text-gray-700">{lawyer.total_appointments}</td>
                          <td className="py-3 px-4 text-right text-green-600 font-bold">
                            {lawyer.completed_appointments}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="text-gray-900 font-bold">
                      {Number(lawyer.rating || 0).toFixed(1)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cancellation Reasons */}
              {descriptive.cancellation_reasons.length > 0 && (
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center space-x-3 mb-6">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                    <h3 className="text-xl font-bold text-white">Top Cancellation Reasons</h3>
                  </div>
                  <div className="space-y-3">
                    {descriptive.cancellation_reasons.map((reason, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <span className="text-white">{reason.cancellation_reason}</span>
                        <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-bold">
                          {reason.count} times
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Failed to load analytics</p>
            </div>
          )}
        </>
      )}
    </div>
    </PageTransition>
  );
};

export default AdminAnalytics;