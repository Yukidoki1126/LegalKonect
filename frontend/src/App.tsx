// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LawyersProvider } from './context/LawyersContext';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Profile from './pages/Profile';
import LawyerSearch from './pages/LawyerSearch';
import LawyerDetail from './pages/LawyerDetail';
import Appointments from './pages/Appointments';
import ManualPaymentPage from './pages/ManualPaymentPage';
import PaymentRedirect from './pages/PaymentRedirect';
import Cases from './pages/Cases';
import ClientOnlyRoute from './components/ClientOnlyRoute';
import FAQChatbot from './components/FAQChatbot';
import LawyerRegister from './pages/LawyerRegister';
import PendingApproval from './pages/PendingApproval';
import ToastNotification from './components/ToastNotification';

// Lawyer Dashboard Imports
import LawyerLayout from './pages/lawyer/LawyerLayout';
import LawyerDashboard from './pages/lawyer/LawyerDashboard';
import LawyerAppointments from './pages/lawyer/LawyerAppointments';
import LawyerTransactionHistory from './pages/lawyer/LawyerTransactionHistory';
import LawyerProfile from './pages/lawyer/LawyerProfile';
import LawyerSchedule from './pages/lawyer/LawyerSchedule';
import LawyerGoogleCalendar from './pages/lawyer/LawyerGoogleCalendar';
import LawyerCases from './pages/LawyerCases';

// Admin Imports
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOverview from './pages/admin/AdminOverview';
import AdminLawyers from './pages/admin/AdminLawyers';
import AdminAppointments from './pages/admin/AdminAppointments';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPayments from './pages/admin/AdminPayments';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminFaqs from './pages/admin/AdminFaqs';
import AdminVerifications from './pages/admin/AdminVerifications';
import AdminManagement from './pages/admin/AdminManagement';

function AppContent() {
  const location = useLocation();
  const isLawyerRoute = location.pathname.startsWith('/lawyer/');
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAuthRoute = location.pathname === '/login' ||
                      location.pathname === '/register' ||
                      location.pathname === '/forgot-password' ||
                      location.pathname === '/reset-password' ||
                      location.pathname === '/lawyer/register' ||
                      location.pathname === '/pending-approval' ||
                      location.pathname === '/terms' ||
                      location.pathname === '/privacy';

  const showNavigation = !isLawyerRoute && !isAdminRoute && !isAuthRoute;

  return (
    <div className="min-h-screen bg-gray-50">
      {showNavigation && <Navigation />}
      <div className={showNavigation ? 'pt-16' : ''}>
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/lawyer/register" element={<LawyerRegister />} />
        <Route path="/pending-approval" element={<PendingApproval />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lawyers"
          element={
            <ProtectedRoute>
              <LawyerSearch />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lawyers/:id"
          element={
            <ProtectedRoute>
              <LawyerDetail />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/appointments" 
          element={
            <ProtectedRoute>
              <Appointments />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/appointments/:appointmentId/payment"
          element={
            <ProtectedRoute>
              <ManualPaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments/:appointmentId/success"
          element={
            <ProtectedRoute>
              <PaymentRedirect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cases"
          element={
            <ProtectedRoute>
              <Cases />
            </ProtectedRoute>
          }
        />

        {/* Protected Lawyer Dashboard Routes */}
        <Route
          path="/lawyer"
          element={
            <ProtectedRoute>
              <LawyerLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<LawyerDashboard />} />
          <Route path="appointments" element={<LawyerAppointments />} />
          <Route path="cases" element={<LawyerCases />} />
          <Route path="calendar" element={<LawyerGoogleCalendar />} />
          <Route path="schedule" element={<LawyerSchedule />} />
          <Route path="earnings" element={<LawyerTransactionHistory />} />
          <Route path="transactions" element={<LawyerTransactionHistory />} />
          <Route path="profile" element={<LawyerProfile />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />}>
          <Route index element={<AdminOverview />} />
          <Route path="dashboard" element={<AdminOverview />} />
          <Route path="lawyers" element={<AdminLawyers />} />
          <Route path="verifications" element={<AdminVerifications />} />
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="faqs" element={<AdminFaqs />} />
          <Route path="admins" element={<AdminManagement />} />
        </Route>
      </Routes>

      {/* FAQ Chatbot - Only show for clients (not on lawyer or admin routes) */}
      {!isLawyerRoute && !isAdminRoute && <FAQChatbot />}
      
      {/* Real-time Toast Notifications */}
      <ToastNotification />
      </div>
    </div>
  );
}

function App() {
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <LawyersProvider>
          <Router>
            <AppContent />
          </Router>
        </LawyersProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;