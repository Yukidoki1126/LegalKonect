// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

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
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-4">
        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Side: Welcome and Quick Actions */}
          <div className="lg:col-span-9 space-y-4">
            {/* Welcome and Time Section */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 text-white">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">
                    {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
                  </h1>
                  <p className="text-blue-100 text-sm sm:text-base md:text-lg">
                    {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-blue-100 text-xs sm:text-sm">Local Time</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                <Link
                  to="/lawyers"
                  className="group bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg sm:rounded-xl shadow-md p-4 sm:p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="text-4xl sm:text-5xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">🔍</div>
                    <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">Find Lawyers</h3>
                    <p className="text-blue-100 text-xs sm:text-sm">Search by location & specialty</p>
                  </div>
                </Link>

                <Link
                  to="/appointments"
                  className="group bg-white rounded-lg sm:rounded-xl shadow-md p-4 sm:p-6 border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="text-4xl sm:text-5xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">📅</div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">My Appointments</h3>
                    <p className="text-gray-600 text-xs sm:text-sm">View upcoming bookings</p>
                  </div>
                </Link>

                <Link
                  to="/cases"
                  className="group bg-white rounded-lg sm:rounded-xl shadow-md p-4 sm:p-6 border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 sm:col-span-2 md:col-span-1"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="text-4xl sm:text-5xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">📋</div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">My Cases</h3>
                    <p className="text-gray-600 text-xs sm:text-sm">Manage your legal cases</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Recent Activity</h2>
                <Link to="/appointments" className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-semibold whitespace-nowrap">
                  View All →
                </Link>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors">
                    <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-${activity.color}-100 flex items-center justify-center`}>
                      <span className="text-xl sm:text-2xl">{activity.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{activity.title}</p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-1">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1 sm:mt-2">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side: Profile & Info */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            {/* User Profile Card */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
              <div className="flex flex-col items-center text-center">
                <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mb-3 sm:mb-4 shadow-lg overflow-hidden">
                  {user?.profile_picture ? (
                    <img
                      src={
                        user.profile_picture.startsWith('http')
                          ? user.profile_picture
                          : `http://localhost:8000/storage/${user.profile_picture}`
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
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 truncate w-full px-2">{user?.name}</h3>
                <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 truncate w-full px-2">{user?.email}</p>

                <div className="w-full space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                  {user?.phone && (
                    <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-xs">📱 Phone</span>
                        <span className="text-gray-900 font-medium text-xs sm:text-sm truncate ml-2">{user.phone}</span>
                      </div>
                    </div>
                  )}

                  {user?.city && (
                    <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-xs whitespace-nowrap">📍 Location</span>
                        <span className="text-gray-900 font-medium text-xs sm:text-sm truncate ml-2">{user.city}, {user.province}</span>
                      </div>
                    </div>
                  )}

                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-2 sm:p-3 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-xs">👤 Account</span>
                      <span className="text-blue-600 font-medium text-xs sm:text-sm">Active</span>
                    </div>
                  </div>
                </div>

                <Link
                  to="/profile"
                  className="w-full inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg text-sm sm:text-base"
                >
                  Edit Profile
                </Link>
              </div>
            </div>

            {/* Help Section */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Need Help?</h3>
              <div className="space-y-2 sm:space-y-3">
                <button className="w-full flex items-center space-x-3 p-2.5 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <span className="text-xl sm:text-2xl">💬</span>
                  <div>
                    <p className="font-medium text-gray-900 text-xs sm:text-sm">Support Chat</p>
                    <p className="text-xs text-gray-600">Get instant help</p>
                  </div>
                </button>
                <button className="w-full flex items-center space-x-3 p-2.5 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <span className="text-xl sm:text-2xl">📚</span>
                  <div>
                    <p className="font-medium text-gray-900 text-xs sm:text-sm">Help Center</p>
                    <p className="text-xs text-gray-600">Browse FAQs</p>
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
