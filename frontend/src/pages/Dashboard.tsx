// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { STORAGE_URL } from '../config/api.config';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Mock data - replace with actual API calls
  const stats = {
    totalAppointments: 12,
    upcomingAppointments: 3,
    completedCases: 5,
    pendingCases: 2,
  };

  const recentActivities = [
    {
      id: 1,
      type: 'appointment',
      title: 'Consultation with Sarah Johnson',
      description: 'Corporate Law consultation scheduled',
      time: '2 hours ago',
      icon: '📅',
      color: 'blue'
    },
    {
      id: 2,
      type: 'case',
      title: 'Case Update: Employment Dispute',
      description: 'Documents submitted to court',
      time: '5 hours ago',
      icon: '📋',
      color: 'purple'
    },
    {
      id: 3,
      type: 'payment',
      title: 'Payment Received',
      description: 'Payment confirmed for consultation',
      time: '1 day ago',
      icon: '💳',
      color: 'green'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 animate-fadeIn">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-4">
        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Side: Welcome and Quick Actions */}
          <div className="lg:col-span-9 space-y-6">
            {/* Welcome and Time Section */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-2xl shadow-xl p-6 sm:p-8 text-white relative overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
              </div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                    {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
                  </h1>
                  <p className="text-blue-100 text-sm sm:text-base md:text-lg">
                    {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-left md:text-right bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20">
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-blue-100 text-xs sm:text-sm">Local Time</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                <Link
                  to="/lawyers"
                  className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl shadow-lg p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="text-4xl sm:text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🔍</div>
                    <h3 className="text-lg sm:text-xl font-bold mb-2">Find Lawyers</h3>
                    <p className="text-blue-100 text-xs sm:text-sm">Search by location & specialty</p>
                  </div>
                </Link>

                <Link
                  to="/appointments"
                  className="group relative overflow-hidden bg-white rounded-2xl shadow-soft p-6 border-2 border-gray-100 hover:border-blue-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-indigo-50/0 group-hover:from-blue-50/50 group-hover:to-indigo-50/50 transition-all"></div>
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="text-4xl sm:text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">📅</div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">My Appointments</h3>
                    <p className="text-gray-600 text-xs sm:text-sm">View upcoming bookings</p>
                  </div>
                </Link>

                <Link
                  to="/cases"
                  className="group relative overflow-hidden bg-white rounded-2xl shadow-soft p-6 border-2 border-gray-100 hover:border-blue-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 sm:col-span-2 md:col-span-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-indigo-50/0 group-hover:from-blue-50/50 group-hover:to-indigo-50/50 transition-all"></div>
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="text-4xl sm:text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">📋</div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">My Cases</h3>
                    <p className="text-gray-600 text-xs sm:text-sm">Manage your legal cases</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Recent Activity</h2>
                <Link to="/appointments" className="text-blue-600 hover:text-blue-700 text-sm font-semibold whitespace-nowrap flex items-center gap-1 hover:gap-2 transition-all">
                  View All
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="group flex items-start space-x-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/30 transition-all duration-200 border border-transparent hover:border-gray-100">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${
                      activity.color === 'blue' ? 'from-blue-100 to-blue-50' :
                      activity.color === 'purple' ? 'from-purple-100 to-purple-50' :
                      'from-green-100 to-green-50'
                    } flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                      <span className="text-2xl">{activity.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{activity.title}</p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-1">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-2">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side: Profile & Info */}
          <div className="lg:col-span-3 space-y-6">
            {/* User Profile Card */}
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 relative overflow-hidden">
              {/* Background gradient accent */}
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600"></div>
              
              <div className="relative flex flex-col items-center text-center pt-4">
                <div className="relative mb-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg border-4 border-white overflow-hidden">
                    {(user?.profile_picture_url || user?.profile_picture) ? (
                      <img
                        src={
                          user.profile_picture_url ||
                          (user.profile_picture?.startsWith('http')
                            ? user.profile_picture
                            : `${STORAGE_URL}/storage/${user.profile_picture}`)
                        }
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl sm:text-3xl font-bold text-white">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Online indicator */}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 truncate w-full px-2">{user?.name}</h3>
                <p className="text-gray-500 text-sm mb-4 truncate w-full px-2">{user?.email}</p>

                <div className="w-full space-y-3 mb-4">
                  {user?.phone && (
                    <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">📱</span>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.phone}</p>
                      </div>
                    </div>
                  )}

                  {user?.city && (
                    <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">📍</span>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-xs text-gray-500">Location</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.city}, {user.province}</p>
                      </div>
                    </div>
                  )}

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 flex items-center gap-3 border border-green-200">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">✓</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xs text-gray-500">Account Status</p>
                      <p className="text-sm font-bold text-green-600">Active</p>
                    </div>
                  </div>
                </div>

                <Link
                  to="/profile"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </Link>
              </div>
            </div>

            {/* Help Section */}
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Need Help?</h3>
              <div className="space-y-3">
                <button className="group w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 text-left border border-transparent hover:border-blue-100">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-xl">💬</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Support Chat</p>
                    <p className="text-xs text-gray-500">Get instant help</p>
                  </div>
                </button>
                <button className="group w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 transition-all duration-200 text-left border border-transparent hover:border-purple-100">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-xl">📚</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Help Center</p>
                    <p className="text-xs text-gray-500">Browse FAQs</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
