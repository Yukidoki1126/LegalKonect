import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import ReviewModal from '../components/ReviewModal';
import { Star, Eye } from 'lucide-react';

interface Appointment {
  id: number;
  appointment_date: string;
  appointment_time: string;
  status: string;
  consultation_fee: number;
  payment_status: string;
  meeting_type: string;
  client_notes: string;
  lawyer_notes: string;
  created_at: string;
  reschedule_status?: string | null;
  reschedule_reason?: string | null;
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
}

const Appointments: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'cancelled' | 'past'>('upcoming');
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

  const confirmDeclineReschedule = async () => {
    if (!selectedAppointment) return;

    setRespondingToReschedule(true);
    try {
      await api.post(`/appointments/${selectedAppointment.id}/reschedule/decline`);
      setShowDeclineConfirmModal(false);
      setToast({
        show: true,
        message: 'Reschedule declined. Appointment cancelled and refund initiated.',
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

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-4">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">My Appointments</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your legal consultations</p>
        </div>

        {toast.show && (
          <div className={`mb-6 px-4 py-3 rounded-lg flex items-center justify-between ${
            toast.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{toast.message}</span>
            </div>
            <button onClick={() => setToast({ show: false, message: '', type: '' })} className="hover:opacity-75">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {showNotification && paymentStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Payment successful! Your appointment has been confirmed.</span>
            </div>
            <button onClick={() => setShowNotification(false)} className="text-green-600 hover:text-green-800">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {showNotification && paymentStatus === 'failed' && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Payment failed. Please try again or contact support.</span>
            </div>
            <button onClick={() => setShowNotification(false)} className="text-red-600 hover:text-red-800">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === 'upcoming'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setActiveTab('cancelled')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === 'cancelled'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Cancelled
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === 'past'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Completed
              </button>
            </div>
          </div>

          <div className="p-6" style={{ minHeight: '400px' }}>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading appointments...</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
                <p className="text-gray-600 mb-4">
                  {activeTab === 'upcoming'
                    ? "You don't have any upcoming appointments"
                    : activeTab === 'cancelled'
                    ? "You don't have any cancelled appointments"
                    : "You don't have any past appointments"}
                </p>
                <button
                  onClick={() => navigate('/lawyers')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Find a Lawyer
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {appointment.lawyer.first_name} {appointment.lawyer.last_name}
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {appointment.lawyer.specializations.map((spec, idx) => (
                            <span key={idx} className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              {spec.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {/* Show reschedule status badge if pending */}
                        {appointment.reschedule_status === 'pending' && (
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 border border-orange-300">
                            Reschedule Pending
                          </span>
                        )}
                        {/* Only show status badge if not confirmed (since all appointments are auto-confirmed) */}
                        {appointment.status !== 'confirmed' && (
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </span>
                        )}
                        {/* Always show payment status */}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(appointment.payment_status)}`}>
                          {appointment.payment_status.charAt(0).toUpperCase() + appointment.payment_status.slice(1)}
                        </span>
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

                    {/* Reschedule Request Notification */}
                    {appointment.reschedule_status === 'pending' && appointment.proposed_date && (
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
                              <strong>New Date & Time:</strong> {formatDate(appointment.proposed_date)} at {formatTime(appointment.proposed_date.split(' ')[1] || appointment.appointment_time)}
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
                          <strong className="text-gray-700">Reschedule Declined:</strong> You declined the lawyer's reschedule request. The appointment was cancelled and refunded.
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => navigate(`/lawyers/${appointment.lawyer.id}`)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                      >
                        View Lawyer
                      </button>

                      {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                        <button
                          onClick={() => handleCancelClick(appointment)}
                          disabled={cancellingId === appointment.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition"
                        >
                          {cancellingId === appointment.id ? 'Cancelling...' : 'Cancel Appointment'}
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
            <div className="relative bg-gradient-to-br from-red-600 to-rose-700 p-8 rounded-t-2xl">
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
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Cancel Appointment</h3>
                  <p className="text-red-100 text-sm mt-1">This action cannot be undone</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8">
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm font-semibold text-gray-900 mb-2">Appointment Details:</p>
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

              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Reason for Cancellation <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please provide a reason for canceling this appointment..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none text-sm"
                  autoFocus
                />
                <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  This reason will be sent to the lawyer
                </p>
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
                  className="flex-1 px-5 py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  Keep Appointment
                </button>
                <button
                  type="button"
                  onClick={handleCancelAppointment}
                  disabled={cancellingId !== null || !cancelReason.trim()}
                  className="flex-1 px-5 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-semibold hover:from-red-700 hover:to-rose-700 disabled:from-gray-400 disabled:to-gray-400 transition-all hover:shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {cancellingId !== null ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel Appointment
                    </>
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
                          <li>• Your payment will be refunded within 5-7 business days</li>
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
                    {formatDate(selectedAppointment.proposed_date || '')} at {formatTime(selectedAppointment.proposed_date?.split(' ')[1] || selectedAppointment.appointment_time)}
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
                      <li><strong>Decline:</strong> Appointment will be cancelled and you'll receive a full refund</li>
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
                      <span className="font-semibold">{formatTime(selectedAppointment.proposed_date?.split(' ')[1] || selectedAppointment.appointment_time)}</span>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span><strong>Process a full refund</strong> of ₱{selectedAppointment.lawyer.reservation_fee || 100}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span><strong>Notify the lawyer</strong> that you declined</span>
                  </li>
                </ul>
              </div>

              {/* Refund Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900 mb-1">Refund Information</p>
                    <p className="text-sm text-blue-800">
                      Your refund will be processed within 1-10 business days depending on your payment method.
                    </p>
                  </div>
                </div>
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
                      Yes, Decline & Get Refund
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