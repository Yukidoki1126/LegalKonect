import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Clock, Star, Calendar, BarChart3, PieChart, AlertCircle } from 'lucide-react';
import adminApi from '../../services/adminApi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DescriptiveAnalytics {
  top_specializations: { name: string; appointment_count: number }[];
  appointment_trends: { date: string; total: number; confirmed: number; completed: number; cancelled: number }[];
  peak_hours: { hour: number; count: number }[];
  top_lawyers: any[];
  meeting_types: { meeting_type: string; count: number }[];
  avg_fee_by_specialization: any[];
  retention_rate: number;
  total_clients: number;
  total_lawyers: number;
  repeat_clients: number;
  cancellation_reasons: { cancellation_reason: string; count: number }[];
  avg_response_time_minutes: number;
  period_days: number;
  total_appointments: number;
}

const AdminAnalytics: React.FC = () => {
  const [descriptive, setDescriptive] = useState<DescriptiveAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load descriptive analytics on mount
  useEffect(() => {
    if (!dataLoaded) {
      loadDescriptiveAnalytics();
    }
  }, [dataLoaded]);

  // Reload when period changes
  useEffect(() => {
    if (dataLoaded) {
      loadDescriptiveAnalytics();
    }
  }, [period]);

  const loadDescriptiveAnalytics = async () => {
    try {
      setLoading(true);
      const response = await adminApi.get(`/descriptive-analytics?days=${period}`);
      setDescriptive(response.data);
      setDataLoaded(true);
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
        total_lawyers: 0,
        repeat_clients: 0,
        cancellation_reasons: [],
        avg_response_time_minutes: 0,
        period_days: 30,
        total_appointments: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !descriptive) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg p-6 h-32 border border-gray-200 shadow-sm"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Analytics Reports</h1>
            <p className="text-sm sm:text-base text-gray-600">Comprehensive insights and performance metrics</p>
          </div>

          <select
            value={period}
            onChange={(e) => {
              setPeriod(Number(e.target.value));
              setDescriptive(null);
            }}
            className="px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
            <option value={365}>Last Year</option>
          </select>
        </div>

        {/* Reports Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading analytics...</p>
          </div>
        ) : descriptive ? (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-gray-500 text-sm font-medium mb-1">Verified Lawyers</p>
                    <p className="text-3xl font-bold text-gray-900 break-words">{descriptive.total_lawyers?.toLocaleString() || 0}</p>
                    <p className="text-gray-400 text-xs mt-1">verified lawyers</p>
                  </div>
                  <Users className="w-12 h-12 text-purple-500 bg-purple-50 rounded-xl p-2 flex-shrink-0" />
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-gray-500 text-sm font-medium mb-1">Total Clients</p>
                    <p className="text-3xl font-bold text-gray-900 break-words">{descriptive.total_clients.toLocaleString()}</p>
                    <p className="text-gray-400 text-xs mt-1">in this period</p>
                  </div>
                  <Users className="w-12 h-12 text-green-500 bg-green-50 rounded-xl p-2 flex-shrink-0" />
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-gray-500 text-sm font-medium mb-1">Appointments</p>
                    <p className="text-3xl font-bold text-gray-900 break-words">
                      {(descriptive.total_appointments ?? 0).toLocaleString()}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">total bookings</p>
                  </div>
                  <Calendar className="w-12 h-12 text-orange-500 bg-orange-50 rounded-xl p-2 flex-shrink-0" />
                </div>
              </div>
            </div>

            {/* Most Requested Legal Expertise */}
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
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Top Cancellation Reasons</h3>
                </div>
                <div className="space-y-3">
                  {descriptive.cancellation_reasons.map((reason, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-lg">
                      <span className="text-gray-700 font-medium">{reason.cancellation_reason}</span>
                      <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-bold">
                        {reason.count} {reason.count === 1 ? 'time' : 'times'}
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
      </div>
  );
};

export default AdminAnalytics;
