import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { lawyerApi } from '../../services/lawyerApi';
import LawyerRejected from './LawyerRejected';

interface LawyerStatus {
  verification_status: 'pending' | 'verified' | 'rejected';
  first_name: string;
  last_name: string;
  verification_notes?: string;
}

const LawyerLayout: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lawyerStatus, setLawyerStatus] = useState<LawyerStatus | null>(null);
  const [loading, setLoading] = useState(true);

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
        first_name: lawyer.first_name,
        last_name: lawyer.last_name,
        verification_notes: lawyer.verification_notes,
      });
    } catch (error: any) {
      // Check if the error response indicates rejection
      const errorData = error.response?.data;
      if (errorData?.rejected === true || errorData?.verification_status === 'rejected') {
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
          <div className="flex justify-between h-14">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden mr-3 p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>

              <div className="flex items-center gap-2">
                <img 
                  src="https://pub-c2fcfa54c78d46cfbf87fcdba61cfbfe.r2.dev/system_logo/legalkonect.png" 
                  alt="LegalKonect" 
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-lg font-semibold text-gray-900">LegalKonect</span>
              </div>
              <span className="ml-3 text-sm text-gray-500">Lawyer Portal</span>
            </div>

           <div className="flex items-center">
  <button
    onClick={handleLogout}
    className="text-red-600 hover:text-red-700 px-3 py-1.5 text-sm font-medium hover:bg-red-50 rounded-md transition-colors"
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