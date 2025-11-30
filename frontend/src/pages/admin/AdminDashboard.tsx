import React, { useEffect, useState } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { adminAuthService, clearAdminCache } from '../../services/adminApi';
import PageTransition from '../../components/PageTransition';


interface Admin {
  id: number;
  name: string;
  email: string;
  role?: string;
  last_login_at: string;
}

const AdminDashboard: React.FC = () => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if admin token exists before loading
    const token = sessionStorage.getItem('admin_token');
    console.log('AdminDashboard: Checking token:', token ? 'exists' : 'missing');
    if (!token) {
      navigate('/login');
      return;
    }
    // Clear cache to ensure fresh data
    clearAdminCache();
    loadAdmin();
  }, []);

  const loadAdmin = async () => {
    try {
      console.log('AdminDashboard: Loading admin data...');
      const adminData = await adminAuthService.me();
      console.log('AdminDashboard: Admin data loaded:', adminData);
      setAdmin(adminData);
    } catch (error) {
      console.error('AdminDashboard: Error loading admin:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await adminAuthService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Top Navigation Bar Skeleton */}
        <nav className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-blue-600 rounded-md animate-pulse"></div>
                <div>
                  <div className="h-5 bg-gray-200 rounded w-36 mb-1 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-1 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
                <div className="h-9 bg-gray-200 rounded-md w-20 animate-pulse"></div>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex pt-16">
          {/* Sidebar Skeleton */}
          <aside className="w-72 bg-white h-[calc(100vh-4rem)] border-r border-gray-200 fixed top-16 left-0 overflow-y-auto z-40">
            <nav className="p-3 space-y-1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="flex items-center space-x-3 px-3 py-2.5 rounded-md animate-pulse">
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-28"></div>
                </div>
              ))}
            </nav>
          </aside>

          {/* Main Content Skeleton */}
          <main className="ml-72 flex-1 p-6 min-h-[calc(100vh-4rem)]">
            <div className="max-w-7xl mx-auto">
              <div className="h-8 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
     <PageTransition>
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-blue-600 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-blue-600">LegalKonect Admin</h1>
                <p className="text-xs text-gray-500">Management Portal</p>
              </div>
            </div>

            {/* Admin Info & Logout */}
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{admin?.role === 'super_admin' ? 'Super Admin' : 'Admin'}</p>
                <p className="text-xs text-gray-500">{admin?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        {/* Sidebar Navigation */}
        <aside className="w-72 bg-white h-[calc(100vh-4rem)] border-r border-gray-200 fixed top-16 left-0 overflow-y-auto z-40">
          <nav className="p-4 space-y-1.5">
            <Link
              to="/admin/dashboard"
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                isActive('/admin/dashboard') && location.pathname === '/admin/dashboard'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="font-semibold text-[15px]">Dashboard</span>
            </Link>

            <Link
              to="/admin/lawyers"
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                isActive('/admin/lawyers')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="font-semibold text-[15px]">Lawyers</span>
            </Link>

            <Link
              to="/admin/verifications"
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                isActive('/admin/verifications')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="font-semibold text-[15px]">Verifications</span>
            </Link>

            <Link
              to="/admin/appointments"
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                isActive('/admin/appointments')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-semibold text-[15px]">Appointments</span>
            </Link>

            <Link
              to="/admin/users"
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                isActive('/admin/users')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="font-semibold text-[15px]">Users</span>
            </Link>

            <Link
              to="/admin/payments"
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                isActive('/admin/payments')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="font-semibold text-[15px]">Transactions</span>
            </Link>

            <Link
              to="/admin/payouts"
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                isActive('/admin/payouts')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="font-semibold text-[15px]">Payouts</span>
            </Link>

            {/* Super Admin Only - FAQs and Analytics */}
            {admin?.role === 'super_admin' && (
              <>
                <Link
                  to="/admin/faqs"
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive('/admin/faqs')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold text-[15px]">FAQs</span>
                </Link>

                <Link
                  to="/admin/analytics"
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive('/admin/analytics')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="font-semibold text-[15px]">Analytics</span>
                </Link>
              </>
            )}

            {/* Super Admin Only */}
            {admin?.role === 'super_admin' && (
              <Link
                to="/admin/admins"
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive('/admin/admins')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="font-semibold text-[15px]">Admin Management</span>
                <span className="ml-auto bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-lg">
                  SUPER
                </span>
              </Link>
            )}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 ml-72 min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
    </PageTransition>
  );
};

export default AdminDashboard;