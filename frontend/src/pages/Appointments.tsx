import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { cacheService } from '../services/cacheService';
import ReviewModal from '../components/ReviewModal';
import { Star, Eye } from 'lucide-react';
import { notificationService } from '../services/notificationService';

interface Appointment {
  id: number;
  appointment_date: string;
  appointment_time: string;
  status: string;
  consultation_fee: number;
  payment_status: string;
  payment_confirmed?: boolean | null;
  payment_proof?: string | null;
  meeting_type: string;
  client_notes: string;
  lawyer_notes: string;
  created_at: string;
  reschedule_status?: string | null;
  reschedule_reason?: string | null;
  reschedule_requested_by?: string | null;
  client_reschedule_used?: boolean;
  original_date?: string | null;
  proposed_date?: string | null;
  reschedule_requested_at?: string | null;
  review?: {
    id: number;
    rating: number;
    comment: string;
    is_approved: boolean;
    created_at: string;
  };
  lawyer: {
    id: number;
    first_name: string;
    last_name: string;
    office_address: string;
    reservation_fee?: number;
    specializations: Array<{ name: string }>;
  };
  specialization?: { id: number; name: string } | null;
  confirmed_specialization?: { id: number; name: string } | null;
}

const Appointments: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'reschedule' | 'cancelled' | 'past'>('upcoming');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [viewReviewModalOpen, setViewReviewModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCancelSuccessModal, setShowCancelSuccessModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showRescheduleSuccessModal, setShowRescheduleSuccessModal] = useState(false);
  const [showDeclineConfirmModal, setShowDeclineConfirmModal] = useState(false);
  const [respondingToReschedule, setRespondingToReschedule] = useState(false);
  
  // Client reschedule state
  const [showClientRescheduleModal, setShowClientRescheduleModal] = useState(false);
  const [clientRescheduleReason, setClientRescheduleReason] = useState('');
  const [clientRescheduleDate, setClientRescheduleDate] = useState('');
  const [clientRescheduleTime, setClientRescheduleTime] = useState('');
  const [submittingClientReschedule, setSubmittingClientReschedule] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const paymentStatus = searchParams.get('payment');
  const [showNotification, setShowNotification] = useState(!!paymentStatus);

  const fetchAppointments = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await api.get(`/appointments?type=${activeTab}`);
      setAppointments(response.data.appointments);
    } catch (err) {
      console.error('Failed to load appointments', err);
      setAppointments([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    let isMounted = true;

    const loadAppointments = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/appointments?type=${activeTab}`);
        // Only update state if component is still mounted and this is the latest request
        if (isMounted) {
          setAppointments(response.data.appointments);
        }
      } catch (err) {
        console.error('Failed to load appointments', err);
        if (isMounted) {
          setAppointments([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAppointments();

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  // Auto-refresh appointments every 15 seconds for real-time updates
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchAppointments(false); // Silent refresh without showing loading spinner
    }, 15000); // 15 seconds

    return () => clearInterval(intervalId);
  }, [fetchAppointments]);

  // Subscribe to notifications for immediate refresh (client-side)
  useEffect(() => {
    const unsubscribe = notificationService.onNewNotification((notification) => {
      // Immediately refresh when reschedule-related notifications arrive
      if (['reschedule_requested', 'appointment_confirmed', 'appointment_cancelled'].includes(notification.type)) {
        console.log('[Appointments] Refreshing due to:', notification.type);
        fetchAppointments(false);
      }
    });

    return () => unsubscribe();
  }, [fetchAppointments]);

  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false);
        navigate('/appointments', { replace: true });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showNotification, navigate]);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Prevent background scroll when cancel modal is open
  useEffect(() => {
    if (showCancelModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showCancelModal]);

  const handleCancelClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleCancelAppointment = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    if (!selectedAppointment) return;

    setCancellingId(selectedAppointment.id);
    try {
      console.log('Cancelling appointment:', selectedAppointment.id);
      const response = await api.post(`/appointments/${selectedAppointment.id}/cancel`, {
        cancellation_reason: cancelReason
      });
      console.log('Cancel response:', response);

      // Invalidate appointments cache to ensure fresh data
      cacheService.invalidatePattern('/appointments');

      setShowCancelModal(false);
      setCancelReason('');
      setShowCancelSuccessModal(true);
      fetchAppointments();
    } catch (err: any) {
      console.error('Cancel appointment error:', err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);

      const errorMessage = err.response?.data?.message || err.message || 'Failed to cancel appointment';

      // Check if it's an authentication error
      if (err.response?.status === 401) {
        alert('Your session has expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

      // Check if it's a forbidden error
      if (err.response?.status === 403) {
        alert('You do not have permission to cancel this appointment.');
        return;
      }

      alert(errorMessage);
    } finally {
      setCancellingId(null);
    }
  };

  const handleOpenReviewModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setReviewModalOpen(true);
  };

  const handleViewReview = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setViewReviewModalOpen(true);
  };

  const handleReviewSuccess = () => {
    setToast({
      show: true,
      message: 'Review submitted successfully! Thank you for your feedback.',
      type: 'success'
    });
    setReviewModalOpen(false);
    setSelectedAppointment(null);
    fetchAppointments();
  };

  const handleViewRescheduleRequest = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowRescheduleModal(true);
  };

  const handleAcceptReschedule = async () => {
    if (!selectedAppointment) return;

    setRespondingToReschedule(true);
    try {
      await api.post(`/appointments/${selectedAppointment.id}/reschedule/accept`);
      cacheService.invalidatePattern('/appointments');
      setShowRescheduleModal(false);
      setShowRescheduleSuccessModal(true);
      fetchAppointments();
    } catch (err: any) {
      console.error('Accept reschedule error:', err);
      alert(err.response?.data?.message || 'Failed to accept reschedule request');
    } finally {
      setRespondingToReschedule(false);
    }
  };

  const handleDeclineReschedule = () => {
    setShowRescheduleModal(false);
    setShowDeclineConfirmModal(true);
  };

  const handleClientRescheduleSubmit = async () => {
    if (!selectedAppointment || !clientRescheduleReason || !clientRescheduleDate || !clientRescheduleTime) return;

    setSubmittingClientReschedule(true);
    try {
      await api.post(`/appointments/${selectedAppointment.id}/client-reschedule`, {
        proposed_date: clientRescheduleDate,
        proposed_time: clientRescheduleTime,
        reason: clientRescheduleReason,
      });
      cacheService.invalidatePattern('/appointments');
      setShowClientRescheduleModal(false);
      setClientRescheduleReason('');
      setClientRescheduleDate('');
      setClientRescheduleTime('');
      setToast({
        show: true,
        message: 'Reschedule request sent! The lawyer will review your request.',
        type: 'success'
      });
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (err: any) {
      console.error('Client reschedule error:', err);
      alert(err.response?.data?.message || 'Failed to submit reschedule request');
    } finally {
      setSubmittingClientReschedule(false);
    }
  };

  const confirmDeclineReschedule = async () => {
    if (!selectedAppointment) return;

    setRespondingToReschedule(true);
    try {
      await api.post(`/appointments/${selectedAppointment.id}/reschedule/decline`);
      cacheService.invalidatePattern('/appointments');
      setShowDeclineConfirmModal(false);
      setToast({
        show: true,
        message: 'Reschedule declined. Appointment cancelled.',
        type: 'success'
      });
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (err: any) {
      console.error('Decline reschedule error:', err);
      alert(err.response?.data?.message || 'Failed to decline reschedule request');
    } finally {
      setRespondingToReschedule(false);
    }
  };

  // Get smart combined status that makes sense to users
  const getSmartStatus = (appointment: Appointment) => {
    // Simple, clear statuses for clients
    if (appointment.status === 'cancelled') {
      return { label: 'Cancelled', color: 'bg-red-100 text-red-800 border border-red-300' };
    }
    if (appointment.status === 'completed') {
      return { label: 'Completed', color: 'bg-blue-100 text-blue-800 border border-blue-300' };
    }
    if (appointment.status === 'no_show') {
      return { label: 'No Show', color: 'bg-gray-100 text-gray-800 border border-gray-300' };
    }

    // For active appointments:
    // - Payment confirmed by lawyer = Partially Paid (green)
    // - Payment proof uploaded but not yet reviewed = For Confirmation (orange)
    // - Payment proof rejected = Unpaid (gray)
    // - Payment not made yet = Unpaid (gray)
    if (appointment.payment_confirmed === true) {
      return { label: 'Partially Paid', color: 'bg-green-100 text-green-800 border border-green-300' };
    }

    // Check if payment proof was uploaded and is pending review
    if (appointment.payment_proof && appointment.payment_confirmed === null) {
      return { label: 'For Confirmation', color: 'bg-orange-100 text-orange-800 border border-orange-300' };
    }

    return { label: 'Unpaid', color: 'bg-gray-100 text-gray-800 border border-gray-300' };
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      no_show: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      unpaid: 'bg-red-100 text-red-800',
      paid: 'bg-green-100 text-green-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Extract time from a datetime string like "2025-12-27 15:00:00" or "2025-12-27T15:00:00"
  const getTimeFromDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return '';
    // Handle both "2025-12-27 15:00:00" and "2025-12-27T15:00:00" formats
    const timePart = dateTimeString.includes('T') 
      ? dateTimeString.split('T')[1] 
      : dateTimeString.split(' ')[1];
    return timePart ? timePart.substring(0, 5) : ''; // Get HH:mm
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 animate-fadeIn pt-16">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-6">
        {/* Enhanced Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
              <p className="text-sm text-gray-500">Manage your legal consultations</p>
            </div>
          </div>
        </div>

        {toast.show && (
          <div className={`mb-6 px-5 py-4 rounded-xl flex items-center justify-between shadow-lg animate-slideDown ${
            toast.type === 'success' 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-800' 
              : 'bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${toast.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                <svg className={`w-5 h-5 ${toast.type === 'success' ? 'text-green-600' : 'text-red-600'}`} fill="currentColor" viewBox="0 0 20 20">
                  {toast.type === 'success' ? (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  )}
                </svg>
              </div>
              <span className="font-semibold">{toast.message}</span>
            </div>
            <button onClick={() => setToast({ show: false, message: '', type: '' })} className="p-1 hover:bg-white/50 rounded-lg transition">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {showNotification && paymentStatus === 'success' && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-800 px-5 py-4 rounded-xl mb-6 flex items-center justify-between shadow-lg animate-slideDown">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <span className="font-bold block">Payment Successful!</span>
                <span className="text-sm text-green-600">Your appointment has been confirmed.</span>
              </div>
            </div>
            <button onClick={() => setShowNotification(false)} className="p-2 hover:bg-white/50 rounded-lg transition">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {showNotification && paymentStatus === 'failed' && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 text-red-800 px-5 py-4 rounded-xl mb-6 flex items-center justify-between shadow-lg animate-slideDown">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <span className="font-bold block">Payment Failed</span>
                <span className="text-sm text-red-600">Please try again or contact support.</span>
              </div>
            </div>
            <button onClick={() => setShowNotification(false)} className="p-2 hover:bg-white/50 rounded-lg transition">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 mb-6 overflow-hidden">
          <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white overflow-x-auto scrollbar-hide">
            <div className="flex min-w-max">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`flex-shrink-0 px-3 sm:px-4 py-4 text-center font-medium transition-all text-xs sm:text-sm flex items-center justify-center gap-2 whitespace-nowrap ${
                  activeTab === 'upcoming'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Upcoming
              </button>
              <button
                onClick={() => setActiveTab('reschedule')}
                className={`flex-shrink-0 px-3 sm:px-4 py-4 text-center font-medium transition-all text-xs sm:text-sm flex items-center justify-center gap-2 whitespace-nowrap ${
                  activeTab === 'reschedule'
                    ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reschedule
              </button>
              <button
                onClick={() => setActiveTab('cancelled')}
                className={`flex-shrink-0 px-3 sm:px-4 py-4 text-center font-medium transition-all text-xs sm:text-sm flex items-center justify-center gap-2 whitespace-nowrap ${
                  activeTab === 'cancelled'
                    ? 'text-red-600 border-b-2 border-red-600 bg-red-50/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancelled
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`flex-shrink-0 px-3 sm:px-4 py-4 text-center font-medium transition-all text-xs sm:text-sm flex items-center justify-center gap-2 whitespace-nowrap ${
                  activeTab === 'past'
                    ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Completed
              </button>
            </div>
          </div>

          <div className="p-6" style={{ minHeight: '400px' }}>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-6 animate-pulse">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="h-6 bg-gray-200 rounded-lg w-48 mb-3"></div>
                        <div className="flex gap-2 mb-3">
                          <div className="h-6 bg-gray-100 rounded-full w-24"></div>
                          <div className="h-6 bg-gray-100 rounded-full w-20"></div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-7 bg-gray-100 rounded-full w-20"></div>
                        <div className="h-7 bg-gray-100 rounded-full w-16"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-5 bg-gray-100 rounded w-40"></div>
                      <div className="h-5 bg-gray-100 rounded w-32"></div>
                      <div className="h-5 bg-gray-100 rounded w-28"></div>
                      <div className="h-5 bg-gray-100 rounded w-36"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-soft">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No appointments found</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  {activeTab === 'upcoming'
                    ? "You don't have any upcoming appointments. Book a consultation with a lawyer to get started."
                    : activeTab === 'reschedule'
                    ? "You don't have any pending reschedule requests at the moment."
                    : activeTab === 'cancelled'
                    ? "You don't have any cancelled appointments."
                    : "You don't have any completed appointments yet."}
                </p>
                {activeTab === 'upcoming' && (
                  <button
                    onClick={() => navigate('/lawyers')}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all inline-flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Find a Lawyer
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="bg-white border-2 border-gray-200 rounded-2xl p-4 sm:p-6 hover:shadow-card hover:border-blue-200 transition-all duration-300 group">
                    {/* Header with Lawyer Name and Status */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4 pb-4 border-b border-gray-100">
                      <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors mb-2">
                          {appointment.lawyer.first_name} {appointment.lawyer.last_name}
                        </h3>
                        
                        {/* Compact specializations - show first 3 only */}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {appointment.lawyer.specializations.slice(0, 3).map((spec, idx) => (
                            <span key={idx} className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-0.5 rounded">
                              {spec.name}
                            </span>
                          ))}
                          {appointment.lawyer.specializations.length > 3 && (
                            <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                              +{appointment.lawyer.specializations.length - 3} more
                            </span>
                          )}
                        </div>
                        
                        {/* Show selected case type */}
                        {(appointment.specialization || appointment.confirmed_specialization) && (
                          <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="font-medium">Case: {appointment.confirmed_specialization?.name || appointment.specialization?.name}</span>
                            {appointment.confirmed_specialization && (
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Status Badges - Stacked on mobile */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
                        {/* Show reschedule status badge if pending */}
                        {appointment.reschedule_status === 'pending' && (
                          <span className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-purple-100 text-purple-800 border-2 border-purple-200 text-center">
                            Reschedule Pending
                          </span>
                        )}
                        
                        {/* Show reschedule available/used indicator for upcoming paid appointments */}
                        {(appointment.status === 'pending' || appointment.status === 'confirmed') && 
                         appointment.payment_status === 'paid' && 
                         appointment.reschedule_status !== 'pending' && (
                          <span className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border-2 text-center whitespace-nowrap ${
                            appointment.client_reschedule_used 
                              ? 'bg-gray-50 text-gray-500 border-gray-200' 
                              : 'bg-blue-50 text-blue-600 border-blue-200'
                          }`} title={appointment.client_reschedule_used ? 'You have used your one-time reschedule' : 'You have 1 reschedule attempt available'}>
                            {appointment.client_reschedule_used ? '0 Reschedule Left' : '1 Reschedule Left'}
                          </span>
                        )}
                        
                        {/* Smart combined status badge */}
                        {(() => {
                          const smartStatus = getSmartStatus(appointment);
                          return (
                            <span className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold border-2 text-center ${smartStatus.color}`}>
                              {smartStatus.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-gray-700">
                        <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDate(appointment.appointment_date)}</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatTime(appointment.appointment_time)}</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span className="capitalize">{appointment.meeting_type}</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <span className="font-medium">₱{appointment.consultation_fee.toLocaleString()}</span>
                          {appointment.payment_status === 'paid' && (
                            <span className="text-xs text-gray-500 ml-2">
                              (Paid: ₱{(appointment.lawyer.reservation_fee || 100).toLocaleString()},
                              Balance: ₱{(appointment.consultation_fee - (appointment.lawyer.reservation_fee || 100)).toLocaleString()})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span>Booked on {new Date(appointment.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}</span>
                      </div>
                    </div>

                    {appointment.client_notes && (
                      <div className="mb-4 p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600">
                          <strong>Your Notes:</strong> {appointment.client_notes}
                        </p>
                      </div>
                    )}

                    {appointment.lawyer_notes && (
                      <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                        <p className="text-sm text-blue-900">
                          <strong className="text-blue-700">Lawyer's Notes:</strong> {appointment.lawyer_notes}
                        </p>
                      </div>
                    )}

                    {/* Reschedule Request Notification (from lawyer) */}
                    {appointment.reschedule_status === 'pending' && appointment.proposed_date && appointment.reschedule_requested_by === 'lawyer' && (
                      <div className="mb-4 p-4 bg-orange-50 border-l-4 border-orange-500 rounded-lg">
                        <div className="flex items-start gap-3">
                          <svg className="w-6 h-6 text-orange-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-orange-900 mb-2">
                              Reschedule Request from Lawyer
                            </p>
                            <p className="text-sm text-orange-800 mb-2">
                              <strong>Reason:</strong> {appointment.reschedule_reason}
                            </p>
                            <p className="text-sm text-orange-800 mb-3">
                              <strong>New Date & Time:</strong> {formatDate(appointment.proposed_date)} at {formatTime(getTimeFromDateTime(appointment.proposed_date) || appointment.appointment_time)}
                            </p>
                            <button
                              onClick={() => handleViewRescheduleRequest(appointment)}
                              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm font-medium"
                            >
                              Respond to Request
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Client's pending reschedule request notification */}
                    {appointment.reschedule_status === 'pending' && appointment.reschedule_requested_by === 'client' && (
                      <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                        <div className="flex items-start gap-3">
                          <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-blue-900 mb-1">Your Reschedule Request is Pending</p>
                            <p className="text-sm text-blue-800 mb-1">
                              <strong>Proposed Date:</strong> {formatDate(appointment.proposed_date || '')} at {formatTime(getTimeFromDateTime(appointment.proposed_date || '') || appointment.appointment_time)}
                            </p>
                            <p className="text-sm text-blue-800">
                              <strong>Reason:</strong> {appointment.reschedule_reason}
                            </p>
                            <p className="text-xs text-blue-600 mt-2">Waiting for lawyer's response...</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Client used reschedule indicator */}
                    {appointment.client_reschedule_used && appointment.reschedule_status !== 'pending' && (appointment.status === 'pending' || appointment.status === 'confirmed') && (
                      <div className="mb-4 p-3 bg-gray-50 border-l-4 border-gray-400 rounded">
                        <p className="text-sm text-gray-700">
                          <svg className="w-4 h-4 inline mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <strong>Reschedule Used:</strong> You've already used your one-time reschedule for this appointment.
                        </p>
                      </div>
                    )}

                    {/* Reschedule Accepted Notification */}
                    {appointment.reschedule_status === 'accepted' && (
                      <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 rounded">
                        <p className="text-sm text-green-900">
                          <strong className="text-green-700">Reschedule Accepted:</strong> You accepted the lawyer's reschedule request. The appointment date has been updated.
                        </p>
                      </div>
                    )}

                    {/* Reschedule Declined Notification */}
                    {appointment.reschedule_status === 'declined' && (
                      <div className="mb-4 p-3 bg-gray-50 border-l-4 border-gray-500 rounded">
                        <p className="text-sm text-gray-900">
                          <strong className="text-gray-700">Reschedule Declined:</strong> You declined the lawyer's reschedule request. The appointment was cancelled.
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => navigate(`/lawyers/${appointment.lawyer.id}`)}
                        className="px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        View Lawyer
                      </button>

                      {/* Show Pay Now only if payment not made yet AND no proof uploaded */}
                      {appointment.payment_status === 'unpaid' &&
                       appointment.status !== 'cancelled' &&
                       !appointment.payment_proof && (
                        <button
                          onClick={() => navigate(`/appointments/${appointment.id}/payment`)}
                          className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 hover:shadow-lg transition-all flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          Pay Now
                        </button>
                      )}

                      {/* Request Reschedule Button - only for paid appointments that haven't used reschedule */}
                      {(appointment.status === 'pending' || appointment.status === 'confirmed') && 
                       appointment.payment_status === 'paid' && 
                       !appointment.client_reschedule_used && 
                       appointment.reschedule_status !== 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setShowClientRescheduleModal(true);
                          }}
                          className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 hover:shadow-lg transition-all flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Request Reschedule
                        </button>
                      )}

                      {/* Only show cancel for unpaid appointments WITHOUT payment proof uploaded */}
                      {(appointment.status === 'pending' || appointment.status === 'confirmed') &&
                       appointment.payment_status === 'unpaid' &&
                       !appointment.payment_proof && (
                        <button
                          onClick={() => handleCancelClick(appointment)}
                          disabled={cancellingId === appointment.id}
                          className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-medium hover:from-red-600 hover:to-rose-600 hover:shadow-lg disabled:from-gray-300 disabled:to-gray-300 transition-all flex items-center gap-2"
                        >
                          {cancellingId === appointment.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Cancel
                            </>
                          )}
                        </button>
                      )}

                      {appointment.status === 'completed' && !appointment.review && (
                        <button
                          onClick={() => handleOpenReviewModal(appointment)}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
                        >
                          <Star className="w-4 h-4" />
                          Write Review
                        </button>
                      )}

                      {appointment.status === 'completed' && appointment.review && (
                        <button
                          onClick={() => handleViewReview(appointment)}
                          className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Review
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Write Review Modal */}
      {selectedAppointment && !selectedAppointment.review && (
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedAppointment(null);
          }}
          appointmentId={selectedAppointment.id}
          lawyerName={`${selectedAppointment.lawyer.first_name} ${selectedAppointment.lawyer.last_name}`}
          onSuccess={handleReviewSuccess}
        />
      )}

      {/* View Review Modal */}
      {selectedAppointment && selectedAppointment.review && viewReviewModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => {
                setViewReviewModalOpen(false);
                setSelectedAppointment(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Review</h2>
              <p className="text-gray-600">
                For <span className="font-semibold">{selectedAppointment.lawyer.first_name} {selectedAppointment.lawyer.last_name}</span>
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-8 h-8 ${
                      star <= selectedAppointment.review!.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-800">{selectedAppointment.review!.comment}</p>
              </div>
            </div>

            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✓ Your review is published and visible to others
              </p>
            </div>

            <button
              onClick={() => {
                setViewReviewModalOpen(false);
                setSelectedAppointment(null);
              }}
              className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Cancel Appointment Modal */}
      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative bg-gradient-to-br from-red-600 to-rose-700 p-6 rounded-t-2xl">
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedAppointment(null);
                  setCancelReason('');
                }}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Cancel Appointment</h3>
                  <p className="text-red-100 text-sm">This action cannot be undone</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Appointment Details */}
              <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-2">Appointment Details</p>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Lawyer:</span>
                    <span className="text-sm font-semibold text-gray-900">{selectedAppointment.lawyer.first_name} {selectedAppointment.lawyer.last_name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Date:</span>
                    <span className="text-sm font-semibold text-gray-900">{formatDate(selectedAppointment.appointment_date)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Time:</span>
                    <span className="text-sm font-semibold text-gray-900">{formatTime(selectedAppointment.appointment_time)}</span>
                  </div>
                </div>
              </div>

              {/* Non-Refundable Warning for Paid */}
              {selectedAppointment.payment_status === 'paid' && (
                <div className="mb-4 p-4 rounded-xl border-2 border-amber-200 bg-amber-50">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-900">Non-Refundable</h4>
                      <p className="text-sm text-amber-800 mt-0.5">
                        The reservation fee of <strong>₱{selectedAppointment.lawyer.reservation_fee?.toLocaleString() || '100'}</strong> is non-refundable once paid.
                      </p>
                      {!selectedAppointment.client_reschedule_used && (
                        <p className="text-xs text-amber-700 mt-2">
                          💡 <strong>Tip:</strong> Consider requesting a reschedule instead of cancelling.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Reschedule Option */}
              {!selectedAppointment.client_reschedule_used && selectedAppointment.payment_status === 'paid' && (
                <div className="mb-4 p-4 rounded-xl border-2 border-blue-200 bg-blue-50">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-blue-900">Request Reschedule Instead?</h4>
                      <p className="text-sm text-blue-800 mt-0.5 mb-3">
                        You can request to reschedule this appointment to a different date/time. The lawyer will review and approve your request.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCancelModal(false);
                          setShowClientRescheduleModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Request Reschedule
                      </button>
                      <p className="text-xs text-blue-600 mt-2 italic">
                        ⚠️ You can only request reschedule once per appointment
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Reason Input */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Reason for Cancellation <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please provide a reason for canceling this appointment..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none text-sm"
                  autoFocus
                />
                <p className="mt-1 text-xs text-gray-500">This reason will be sent to the lawyer</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedAppointment(null);
                    setCancelReason('');
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  Keep Appointment
                </button>
                <button
                  type="button"
                  onClick={handleCancelAppointment}
                  disabled={cancellingId !== null || !cancelReason.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-semibold hover:from-red-700 hover:to-rose-700 disabled:from-gray-400 disabled:to-gray-400 transition-all hover:shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {cancellingId !== null ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Cancelling...
                    </>
                  ) : (
                    'Cancel Appointment'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Success Modal */}
      {showCancelSuccessModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fadeIn">
            {/* Modal Header */}
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Appointment Cancelled Successfully
              </h3>

              <p className="text-gray-600 mb-6">
                Your appointment with <span className="font-semibold">{selectedAppointment.lawyer.first_name} {selectedAppointment.lawyer.last_name}</span> has been cancelled.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3 text-left">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900 mb-1">What happens next?</p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {selectedAppointment.payment_status === 'paid' ? (
                        <>
                          <li>• The lawyer has been notified</li>
                          <li>• <strong>Refund Policy:</strong> The lawyer will review and manually process your refund</li>
                          <li>• Refunds may take some time as they require review</li>
                          <li>• You can book a new appointment anytime</li>
                        </>
                      ) : (
                        <>
                          <li>• The lawyer has been notified</li>
                          <li>• No payment was processed</li>
                          <li>• You can book a new appointment anytime</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowCancelSuccessModal(false);
                  setSelectedAppointment(null);
                }}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Response Modal */}
      {showRescheduleModal && selectedAppointment && selectedAppointment.reschedule_status === 'pending' && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all animate-slideUp">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-br from-orange-600 to-amber-700 p-8 rounded-t-2xl">
              <button
                type="button"
                onClick={() => {
                  setShowRescheduleModal(false);
                  setSelectedAppointment(null);
                }}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Reschedule Request</h3>
                  <p className="text-orange-100 text-sm mt-1">Your lawyer needs to reschedule</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8">
              {/* Original Appointment Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm font-semibold text-gray-900 mb-3">Current Appointment:</p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Lawyer:</span> {selectedAppointment.lawyer.first_name} {selectedAppointment.lawyer.last_name}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Date:</span> {formatDate(selectedAppointment.appointment_date)}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Time:</span> {formatTime(selectedAppointment.appointment_time)}
                  </p>
                </div>
              </div>

              {/* Proposed New Date */}
              <div className="mb-6 p-4 bg-orange-50 rounded-xl border-2 border-orange-200">
                <p className="text-sm font-semibold text-orange-900 mb-3">Proposed New Date & Time:</p>
                <div className="space-y-2">
                  <p className="text-base text-orange-900 font-semibold">
                    {formatDate(selectedAppointment.proposed_date || '')} at {formatTime(getTimeFromDateTime(selectedAppointment.proposed_date || '') || selectedAppointment.appointment_time)}
                  </p>
                </div>
              </div>

              {/* Reason */}
              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Reason for Reschedule:
                </label>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-800">{selectedAppointment.reschedule_reason}</p>
                </div>
              </div>

              {/* Info Box */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1 text-sm text-blue-900">
                    <p className="font-semibold mb-1">Your Options:</p>
                    <ul className="space-y-1 text-blue-800">
                      <li><strong>Accept:</strong> Your appointment will be moved to the new date & time</li>
                      <li><strong>Decline:</strong> Appointment will be cancelled. The lawyer will review and process your refund manually (may take some time)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleDeclineReschedule}
                  disabled={respondingToReschedule}
                  className="flex-1 px-5 py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {respondingToReschedule ? 'Processing...' : 'Decline & Refund'}
                </button>
                <button
                  type="button"
                  onClick={handleAcceptReschedule}
                  disabled={respondingToReschedule}
                  className="flex-1 px-5 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {respondingToReschedule ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Accept New Date
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Success Modal */}
      {showRescheduleSuccessModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fadeIn">
            {/* Modal Header */}
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Reschedule Accepted!
              </h3>

              <p className="text-gray-600 mb-6">
                Your appointment with <span className="font-semibold">{selectedAppointment.lawyer.first_name} {selectedAppointment.lawyer.last_name}</span> has been successfully rescheduled.
              </p>

              {/* New Appointment Details */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <div className="text-left">
                  <p className="text-sm font-semibold text-orange-900 mb-3">New Appointment Details:</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-orange-900">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">Date:</span>
                      <span className="font-semibold">{formatDate(selectedAppointment.proposed_date || '')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-orange-900">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Time:</span>
                      <span className="font-semibold">{formatTime(getTimeFromDateTime(selectedAppointment.proposed_date || '') || selectedAppointment.appointment_time)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3 text-left">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900 mb-1">What happens next?</p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Your lawyer has been notified</li>
                      <li>• A confirmation email has been sent</li>
                      <li>• You'll receive a reminder before the appointment</li>
                      <li>• Your payment status remains unchanged</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowRescheduleSuccessModal(false);
                  setSelectedAppointment(null);
                }}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Reschedule Confirmation Modal */}
      {showDeclineConfirmModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all animate-slideUp">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-br from-red-600 to-red-700 p-8 rounded-t-2xl">
              <button
                type="button"
                onClick={() => {
                  setShowDeclineConfirmModal(false);
                  setShowRescheduleModal(true);
                }}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Decline Reschedule?</h3>
                  <p className="text-red-100 text-sm mt-1">This action will cancel the appointment</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8">
              <p className="text-gray-700 mb-6 text-base">
                Are you sure you want to decline this reschedule request? This will:
              </p>

              {/* Consequences List */}
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 mb-6">
                <ul className="space-y-3 text-sm text-red-900">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span><strong>Cancel the appointment</strong> with {selectedAppointment.lawyer.first_name} {selectedAppointment.lawyer.last_name}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span><strong>Notify the lawyer</strong> that you declined</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeclineConfirmModal(false);
                    setShowRescheduleModal(true);
                  }}
                  disabled={respondingToReschedule}
                  className="flex-1 px-5 py-3.5 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={confirmDeclineReschedule}
                  disabled={respondingToReschedule}
                  className="flex-1 px-5 py-3.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {respondingToReschedule ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Yes, Decline & Cancel
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Client Request Reschedule Modal */}
      {showClientRescheduleModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all animate-slideUp">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-t-2xl">
              <button
                type="button"
                onClick={() => {
                  setShowClientRescheduleModal(false);
                  setClientRescheduleReason('');
                  setClientRescheduleDate('');
                  setClientRescheduleTime('');
                  setSelectedAppointment(null);
                }}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Request Reschedule</h3>
                  <p className="text-blue-100 text-sm mt-1">Propose a new date for your appointment</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8">
              {/* Current Appointment Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm font-semibold text-gray-900 mb-2">Current Appointment:</p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Lawyer:</span> {selectedAppointment.lawyer.first_name} {selectedAppointment.lawyer.last_name}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Date:</span> {formatDate(selectedAppointment.appointment_date)}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Time:</span> {formatTime(selectedAppointment.appointment_time)}
                </p>
              </div>

              {/* One-time Warning */}
              <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-amber-800">
                    <strong>One-time only:</strong> You can only request reschedule once per appointment. Make sure to choose a date/time that works for you.
                  </p>
                </div>
              </div>

              {/* Proposed Date */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Proposed Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={clientRescheduleDate}
                  onChange={(e) => setClientRescheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Proposed Time */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Proposed Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={clientRescheduleTime}
                  onChange={(e) => setClientRescheduleTime(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Reason */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Reason for Reschedule <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={clientRescheduleReason}
                  onChange={(e) => setClientRescheduleReason(e.target.value)}
                  placeholder="Please explain why you need to reschedule (e.g., emergency, schedule conflict)..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowClientRescheduleModal(false);
                    setClientRescheduleReason('');
                    setClientRescheduleDate('');
                    setClientRescheduleTime('');
                    setSelectedAppointment(null);
                  }}
                  disabled={submittingClientReschedule}
                  className="flex-1 px-5 py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClientRescheduleSubmit}
                  disabled={submittingClientReschedule || !clientRescheduleReason.trim() || !clientRescheduleDate || !clientRescheduleTime}
                  className="flex-1 px-5 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all hover:shadow-lg disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submittingClientReschedule ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Send Reschedule Request
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;