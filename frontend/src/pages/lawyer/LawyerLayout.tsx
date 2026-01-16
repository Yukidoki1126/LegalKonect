import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { lawyerApi } from '../../services/lawyerApi';
import LawyerRejected from './LawyerRejected';
import { Bell } from 'lucide-react';
import { notificationService, Notification } from '../../services/notificationService';

interface LawyerStatus {
  verification_status: 'pending' | 'verified' | 'rejected';
  status?: 'suspended' | 'approved' | 'pending';
  first_name: string;
  last_name: string;
  verification_notes?: string;
}

const LawyerLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lawyerStatus, setLawyerStatus] = useState<LawyerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Notification states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showNotifications]);

  // Initialize notification service
  useEffect(() => {
    notificationService.start();
    
    const unsubscribe = notificationService.subscribe((newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read_at).length);
    });

    return () => {
      unsubscribe();
      notificationService.stop();
    };
  }, []);

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    await notificationService.markAsRead(notification.id);
    
    // Close dropdown
    setShowNotifications(false);
    
    // Smart redirect based on notification type
    const data = notification.data;
    const isLawyer = data?.user_type === 'lawyer';
    
    // Payment-related notifications
    if (data?.type === 'payment' || notification.type === 'payment_submitted' || notification.type === 'payment_approved') {
      if (isLawyer) {
        navigate('/lawyer/appointments');
      } else {
        navigate('/appointments');
      }
    }
    // Reschedule notifications
    else if (data?.type === 'reschedule' || notification.type === 'reschedule_requested' || notification.type === 'reschedule_approved' || notification.type === 'reschedule_rejected') {
      if (isLawyer) {
        navigate('/lawyer/appointments');
      } else {
        navigate('/appointments');
      }
    }
    // Case notifications
    else if (data?.type === 'case' || notification.type === 'case_created' || notification.type === 'case_updated') {
      if (isLawyer) {
        navigate('/lawyer/cases');
      } else {
        navigate('/appointments');
      }
    }
    // Verification notifications
    else if (notification.type === 'verification_status_changed') {
      if (isLawyer) {
        navigate('/lawyer/dashboard');
      }
    }
    // Appointment notifications
    else if (notification.type === 'appointment_created' || notification.type === 'appointment_confirmed' || notification.type === 'appointment_completed' || notification.type === 'appointment_cancelled') {
      if (isLawyer) {
        navigate('/lawyer/appointments');
      } else {
        navigate('/appointments');
      }
    }
    // Default redirect
    else {
      if (isLawyer) {
        navigate('/lawyer/dashboard');
      } else {
        navigate('/');
      }
    }
  };

  useEffect(() => {
    checkLawyerStatus();
  }, []);

  const checkLawyerStatus = async () => {
    try {
      // Use fresh profile to always get latest verification status
      const response = await lawyerApi.getProfileFresh();
      const lawyer = response.lawyer || response;
      setLawyerStatus({
        verification_status: lawyer.verification_status,
        status: lawyer.status,
        first_name: lawyer.first_name,
        last_name: lawyer.last_name,
        verification_notes: lawyer.verification_notes,
      });
    } catch (error: any) {
      // Check if the error response indicates rejection or suspension
      const errorData = error.response?.data;
      
      // Check for suspended status
      if (errorData?.suspended === true || errorData?.status === 'suspended') {
        setLawyerStatus({
          verification_status: 'verified',
          status: 'suspended',
          first_name: 'Lawyer',
          last_name: '',
        });
      }
      // Check for rejected status
      else if (errorData?.rejected === true || errorData?.verification_status === 'rejected') {
        setLawyerStatus({
          verification_status: 'rejected',
          first_name: errorData.first_name || 'Lawyer',
          last_name: errorData.last_name || '',
          verification_notes: errorData.verification_notes,
        });
      } else if (error.response?.status === 403 && errorData?.message?.includes('rejected')) {
        // Fallback check for rejection message
        setLawyerStatus({
          verification_status: 'rejected',
          first_name: errorData.first_name || 'Lawyer',
          last_name: errorData.last_name || '',
          verification_notes: errorData.verification_notes,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const isActive = (path: string) => location.pathname === path;

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Show suspended page if lawyer is suspended
  if (lawyerStatus?.status === 'suspended') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-10 text-center">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mx-auto flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Account Suspended</h1>
              <p className="text-red-100">Your lawyer account has been temporarily suspended</p>
            </div>
            <div className="p-8">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-800 text-sm leading-relaxed">
                  Your account has been suspended by an administrator. This may be due to a violation of our terms of service or other policy concerns.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-blue-900 font-medium mb-2">What you can do:</p>
                <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
                  <li>Contact our support team for more information</li>
                  <li>Review our terms of service and community guidelines</li>
                  <li>Wait for further communication from our team</li>
                </ul>
              </div>
              <div className="mb-6">
                <a
                  href="mailto:support@legalkonect.com"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Support: support@legalkonect.com
                </a>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Go to Homepage
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
          <p className="text-center text-gray-500 text-xs mt-6">
            © {new Date().getFullYear()} LegalKonect. All rights reserved.
          </p>
        </div>
      </div>
    );
  }

  // Show rejected page if lawyer is rejected
  if (lawyerStatus?.verification_status === 'rejected') {
    return (
      <LawyerRejected
        lawyerName={`${lawyerStatus.first_name} ${lawyerStatus.last_name}`}
        rejectionNotes={lawyerStatus.verification_notes}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="px-4 lg:px-6">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>

              <div className="flex items-center gap-2 min-w-0">
                <img 
                  src="/legalkonect.png" 
                  alt="LegalKonect" 
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base sm:text-lg font-semibold text-gray-900 whitespace-nowrap">LegalKonect</span>
                  <span className="hidden sm:inline text-sm text-gray-500 whitespace-nowrap">Lawyer Portal</span>
                </div>
              </div>
            </div>

            <div className="flex items-center flex-shrink-0 ml-2 gap-2">
              {/* Notification Bell */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full border-2 border-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <p className="text-sm text-gray-500">{unreadCount} unread</p>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                          <p>No notifications yet</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {notifications.map((notification) => (
                            <button
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                                !notification.read_at ? 'bg-blue-50' : 'bg-white'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {/* Icon based on notification type */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  notification.type.includes('reschedule') ? 'bg-yellow-100' :
                                  notification.type.includes('cancel') ? 'bg-red-100' :
                                  notification.type.includes('payment') || notification.type.includes('refund') ? 'bg-green-100' :
                                  'bg-blue-100'
                                }`}>
                                  {notification.type.includes('reschedule') ? (
                                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  ) : notification.type.includes('cancel') ? (
                                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  ) : notification.type.includes('payment') || notification.type.includes('refund') ? (
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 mb-1">
                                    {notification.title || notification.data?.title || 'Notification'}
                                  </p>
                                  <p className="text-xs text-gray-600 mb-1">
                                    {notification.message || notification.data?.message || notification.data?.body}
                                  </p>
                                  <p className="text-xs text-blue-600 font-medium">
                                    {getTimeAgo(notification.created_at)}
                                  </p>
                                </div>

                                {/* Unread indicator */}
                                {!notification.read_at && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium hover:bg-red-50 rounded-md transition-colors whitespace-nowrap"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-14">
        {/* Sidebar Navigation - Desktop */}
        <aside className="hidden lg:block w-72 bg-white border-r border-gray-200 fixed left-0 top-14 bottom-0 overflow-y-auto">
          <nav className="py-6 px-4 space-y-1">
            <Link
              to="/lawyer/dashboard"
              className={`flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors ${
                isActive('/lawyer/dashboard')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>

            <Link
              to="/lawyer/appointments"
              className={`flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors ${
                isActive('/lawyer/appointments')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Appointments
            </Link>

            <Link
              to="/lawyer/cases"
              className={`flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors ${
                isActive('/lawyer/cases')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Cases
            </Link>

            <Link
              to="/lawyer/calendar"
              className={`flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors ${
                isActive('/lawyer/calendar')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <svg className="w-5 h-5 mr-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                <path fill="currentColor" opacity="0.3" d="M7 13h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z" />
              </svg>
              Google Calendar
            </Link>

            <Link
              to="/lawyer/schedule"
              className={`flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors ${
                isActive('/lawyer/schedule')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Weekly Schedule
            </Link>

            <Link
              to="/lawyer/transactions"
              className={`flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors ${
                isActive('/lawyer/transactions') || isActive('/lawyer/earnings')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Transactions
            </Link>

            <Link
              to="/lawyer/profile"
              className={`flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors ${
                isActive('/lawyer/profile')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile Settings
            </Link>
          </nav>
        </aside>

        {/* Mobile Sidebar Navigation */}
        {mobileMenuOpen && (
          <>
            {/* Overlay */}
            <div
              className="lg:hidden fixed inset-0 top-14 bg-black bg-opacity-30 z-30"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Sidebar */}
            <aside className="lg:hidden fixed left-0 top-14 bottom-0 w-72 bg-white border-r border-gray-200 z-40 overflow-y-auto">
              <nav className="py-6 px-4 space-y-1">
              <Link
                to="/lawyer/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors ${
                  isActive('/lawyer/dashboard')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>

              <Link
                to="/lawyer/appointments"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors ${
                  isActive('/lawyer/appointments')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Appointments
              </Link>

              <Link
                to="/lawyer/cases"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors ${
                  isActive('/lawyer/cases')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Cases
              </Link>

              <Link
                to="/lawyer/calendar"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors ${
                  isActive('/lawyer/calendar')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <svg className="w-5 h-5 mr-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Google Calendar
              </Link>

              <Link
                to="/lawyer/schedule"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors ${
                  isActive('/lawyer/schedule')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Weekly Schedule
              </Link>

              <Link
                to="/lawyer/transactions"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors ${
                  isActive('/lawyer/transactions') || isActive('/lawyer/earnings')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Transactions
              </Link>

              <Link
                to="/lawyer/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors ${
                  isActive('/lawyer/profile')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile Settings
              </Link>
            </nav>
          </aside>
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-72 p-4 lg:p-6 max-w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default LawyerLayout;