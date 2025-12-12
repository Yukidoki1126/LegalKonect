import React, { useEffect, useState, useMemo } from 'react';
import { lawyerApi } from '../../services/lawyerApi';
import { useSearchParams } from 'react-router-dom';
import { cacheService } from '../../services/cacheService';
import { notificationService } from '../../services/notificationService';
import { STORAGE_URL } from '../../config/api.config';
import {
  Calendar,
  Clock,
  RefreshCw,
  User,
  Filter,
  ArrowUpDown,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarClock,
  FileText,
  Zap,
  Sparkles
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface Appointment {
  id: number;
  user_id: number;
  lawyer_id: number;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  status: string;
  consultation_fee: number;
  reservation_fee?: number;
  payment_status: string;
  payment_method: string;
  client_notes: string;
  lawyer_notes: string;
  cancellation_reason: string;
  cancelled_at?: string | null;
  meeting_type: string;
  meeting_link: string;
  reschedule_status?: string | null;
  reschedule_reason?: string | null;
  reschedule_requested_by?: string | null;
  client_reschedule_used?: boolean;
  original_date?: string | null;
  proposed_date?: string | null;
  created_at: string;
  user: User;
  specialization?: { id: number; name: string } | null;
  confirmed_specialization?: { id: number; name: string } | null;
  // Payment proof fields
  payment_proof?: string | null;
  payment_method_used?: string | null;
  payment_proof_uploaded_at?: string | null;
  payment_confirmed?: boolean;
  payment_confirmed_at?: string | null;
}

const LawyerAppointments: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('status') || 'all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showBulkRescheduleModal, setShowBulkRescheduleModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCaseTypeModal, setShowCaseTypeModal] = useState(false);
  const [showPaymentProofModal, setShowPaymentProofModal] = useState(false);
  const [showRejectPaymentModal, setShowRejectPaymentModal] = useState(false);
  const [showClientRescheduleModal, setShowClientRescheduleModal] = useState(false);
  const [paymentProofData, setPaymentProofData] = useState<{ url: string; method: string; uploadedAt: string } | null>(null);
  const [rejectPaymentReason, setRejectPaymentReason] = useState('');
  const [lawyerSpecializations, setLawyerSpecializations] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedCaseTypeId, setSelectedCaseTypeId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [notes, setNotes] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [selectedAppointmentIds, setSelectedAppointmentIds] = useState<number[]>([]);
  const [bulkRescheduleDate, setBulkRescheduleDate] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isTabSwitching, setIsTabSwitching] = useState(false);
  
  // Sorting and filtering
  const [sortBy, setSortBy] = useState<'date' | 'booking' | 'name'>('booking');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // Default: Latest First
  const [filterClient, setFilterClient] = useState('');

  // Fetch lawyer's specializations on mount (from their profile, not all specializations)
  useEffect(() => {
    const fetchLawyerSpecializations = async () => {
      try {
        const profile = await lawyerApi.getProfile();
        // Get specializations from the lawyer's profile
        if (profile.specializations && Array.isArray(profile.specializations)) {
          setLawyerSpecializations(profile.specializations);
        }
      } catch (error) {
        console.error('Failed to fetch lawyer specializations:', error);
      }
    };
    fetchLawyerSpecializations();
  }, []);

  useEffect(() => {
    // Clear appointments immediately when tab changes to prevent showing wrong data
    setAppointments([]);
    // Don't clear allAppointments - keep it for badge counts
    setLoading(true);
    fetchAppointments(true).finally(() => {
      setLoading(false);
      // After first load, mark as no longer initial
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    });
  }, [activeTab]);

  // Auto-refresh appointments every 5 seconds for real-time updates
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchAppointments(false, true); // Silent refresh with cache invalidation
    }, 5000); // 5 seconds (fast refresh)

    return () => clearInterval(intervalId);
  }, [activeTab]);

  // Subscribe to notifications for immediate refresh
  useEffect(() => {
    const unsubscribe = notificationService.onNewNotification((notification) => {
      // Immediately refresh when appointment-related notifications arrive
      if (['appointment_created', 'appointment_cancelled', 'reschedule_accepted', 'reschedule_declined', 'payment_received'].includes(notification.type)) {
        console.log('[LawyerAppointments] Refreshing due to:', notification.type);
        cacheService.invalidatePattern('/lawyer/appointments');
        fetchAppointments(false);
      }
    });

    return () => unsubscribe();
  }, [activeTab]);

  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);

  // Helper function to check if appointment is upcoming (within next 3 days, confirmed/pending only)
  const isUpcoming = useMemo(() => {
    return (appointment: Appointment): boolean => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const threeDaysLater = new Date(today);
      threeDaysLater.setDate(threeDaysLater.getDate() + 3);
      
      const appointmentDate = new Date(appointment.appointment_date.split('T')[0]);
      
      // Must be today or within next 3 days
      // Must be confirmed or pending status
      // Must not be cancelled or completed
      return appointmentDate >= today && 
             appointmentDate <= threeDaysLater && 
             ['confirmed', 'pending'].includes(appointment.status);
    };
  }, []);

  // Helper function to check if appointment is a new booking (created within last 24 hours)
  const isNewBooking = useMemo(() => {
    return (appointment: Appointment): boolean => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const createdAt = new Date(appointment.created_at);
      
      // New booking = created within last 24 hours and pending status
      return createdAt >= oneDayAgo && appointment.status === 'pending';
    };
  }, []);

  // Get new bookings count - memoized to prevent flickering
  const newBookingCount = useMemo(() => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return allAppointments.filter(apt => {
      const createdAt = new Date(apt.created_at);
      return createdAt >= oneDayAgo && apt.status === 'pending';
    }).length;
  }, [allAppointments]);

  // Get upcoming appointments count - memoized to prevent flickering
  const upcomingCount = useMemo(() => {
    return allAppointments.filter(apt => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const threeDaysLater = new Date(today);
      threeDaysLater.setDate(threeDaysLater.getDate() + 3);
      
      const appointmentDate = new Date(apt.appointment_date.split('T')[0]);
      
      return appointmentDate >= today && 
             appointmentDate <= threeDaysLater && 
             ['confirmed', 'pending'].includes(apt.status);
    }).length;
  }, [allAppointments]);

  const fetchAppointments = async (showLoading = false, forceRefresh = false) => {
    try {
      if (showLoading) setLoading(true);
      if (!showLoading) setIsRefreshing(true);

      // Force invalidate cache if requested (e.g., manual refresh)
      if (forceRefresh) {
        cacheService.invalidatePattern('/lawyer/appointments');
      }

      // Always fetch all appointments first to ensure accurate badge counts
      const allData = await lawyerApi.getAppointments(undefined);
      setAllAppointments(allData);

      // Then filter for display based on active tab
      if (activeTab === 'all') {
        setAppointments(allData);
      } else if (activeTab === 'new') {
        const filteredData = allData.filter((a: Appointment) => isNewBooking(a));
        setAppointments(filteredData);
      } else if (activeTab === 'upcoming') {
        const filteredData = allData.filter((a: Appointment) => isUpcoming(a));
        setAppointments(filteredData);
      } else if (activeTab === 'reschedule') {
        const filteredData = allData.filter((a: Appointment) => a.reschedule_status === 'pending');
        setAppointments(filteredData);
      } else {
        const filteredData = allData.filter((a: Appointment) => a.status === activeTab);
        setAppointments(filteredData);
      }

      setLastRefreshTime(new Date());
    } catch (err) {
      console.error('Error fetching appointments:', err);
      if (showLoading) {
        setSuccessMessage('Failed to load appointments');
        setShowSuccessModal(true);
      }
    } finally {
      if (showLoading) setLoading(false);
      if (!showLoading) setIsRefreshing(false);
    }
  };

  const handleTabChange = (tab: string) => {
    // Invalidate appointments cache to ensure fresh data
    cacheService.invalidatePattern('/lawyer/appointments');

    // Mark that we're switching tabs (not initial load)
    setIsTabSwitching(true);

    setActiveTab(tab);
    if (tab === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ status: tab });
    }
  };

  // Sort and filter appointments using useMemo for proper reactivity
  const sortedAppointments = useMemo(() => {
    let filtered = [...appointments];
    
    // Filter by client name
    if (filterClient.trim()) {
      filtered = filtered.filter(apt => 
        apt.user?.name?.toLowerCase().includes(filterClient.toLowerCase())
      );
    }
    
    // Sort appointments
    filtered.sort((a, b) => {
      // For cancelled tab, always sort by cancelled_at (when it was cancelled)
      if (a.status === 'cancelled' && b.status === 'cancelled') {
        const cancelledA = a.cancelled_at ? new Date(a.cancelled_at).getTime() : new Date(a.created_at).getTime();
        const cancelledB = b.cancelled_at ? new Date(b.cancelled_at).getTime() : new Date(b.created_at).getTime();
        return sortOrder === 'asc' 
          ? cancelledA - cancelledB 
          : cancelledB - cancelledA;
      }
      
      if (sortBy === 'booking') {
        // Sort by created_at (booking time) - newest bookings first
        const createdA = new Date(a.created_at).getTime();
        const createdB = new Date(b.created_at).getTime();
        return sortOrder === 'asc' 
          ? createdA - createdB 
          : createdB - createdA;
      } else if (sortBy === 'date') {
        // Parse dates properly - handle both ISO format and simple date strings
        const dateStrA = a.appointment_date.split('T')[0];
        const dateStrB = b.appointment_date.split('T')[0];
        const timeStrA = a.appointment_time || '00:00:00';
        const timeStrB = b.appointment_time || '00:00:00';
        
        const dateA = new Date(`${dateStrA}T${timeStrA}`);
        const dateB = new Date(`${dateStrB}T${timeStrB}`);
        
        return sortOrder === 'asc' 
          ? dateA.getTime() - dateB.getTime() 
          : dateB.getTime() - dateA.getTime();
      } else if (sortBy === 'name') {
        const compare = (a.user?.name || '').localeCompare(b.user?.name || '');
        return sortOrder === 'asc' ? compare : -compare;
      }
      return 0;
    });
    
    return filtered;
  }, [appointments, filterClient, sortBy, sortOrder]);

  const handleDeclineClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDeclineReason('');
    setShowDeclineModal(true);
  };

  const handleDeclineSubmit = async () => {
    if (!declineReason.trim()) {
      setSuccessMessage('Please provide a reason for declining');
      setShowSuccessModal(true);
      return;
    }

    if (!selectedAppointment) return;

    try {
      setActionLoading(true);
      await lawyerApi.declineAppointment(selectedAppointment.id, declineReason);
      setShowDeclineModal(false);
      setSuccessMessage('Appointment declined successfully');
      setShowSuccessModal(true);
      fetchAppointments();
    } catch (err) {
      console.error('Error declining appointment:', err);
      setSuccessMessage('Failed to decline appointment');
      setShowSuccessModal(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowCompleteModal(true);
  };

  const handleCompleteSubmit = async () => {
    if (!selectedAppointment) return;

    try {
      setActionLoading(true);
      await lawyerApi.completeAppointment(selectedAppointment.id);
      setShowCompleteModal(false);
      setSuccessMessage('Appointment marked as completed!');
      setShowSuccessModal(true);
      fetchAppointments();
    } catch (err) {
      console.error('Error completing appointment:', err);
      setShowCompleteModal(false);
      setSuccessMessage('Failed to complete appointment');
      setShowSuccessModal(true);
    } finally {
      setActionLoading(false);
    }
  };

  // Payment proof handlers
  const handleViewPaymentProof = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    try {
      const data = await lawyerApi.getPaymentProof(appointment.id);
      setPaymentProofData({
        url: data.payment_proof_url,
        method: data.payment_method_used,
        uploadedAt: data.uploaded_at,
      });
      setShowPaymentProofModal(true);
    } catch (err) {
      console.error('Error fetching payment proof:', err);
      setSuccessMessage('Failed to load payment proof');
      setShowSuccessModal(true);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedAppointment) return;

    try {
      setActionLoading(true);
      await lawyerApi.confirmPayment(selectedAppointment.id);
      setShowPaymentProofModal(false);
      setSuccessMessage('Payment confirmed successfully!');
      setShowSuccessModal(true);
      fetchAppointments();
    } catch (err) {
      console.error('Error confirming payment:', err);
      setSuccessMessage('Failed to confirm payment');
      setShowSuccessModal(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPaymentClick = () => {
    setShowPaymentProofModal(false);
    setRejectPaymentReason('');
    setShowRejectPaymentModal(true);
  };

  const handleRejectPaymentSubmit = async () => {
    if (!selectedAppointment || !rejectPaymentReason.trim()) {
      setSuccessMessage('Please provide a reason for rejection');
      setShowSuccessModal(true);
      return;
    }

    try {
      setActionLoading(true);
      await lawyerApi.rejectPayment(selectedAppointment.id, rejectPaymentReason);
      setShowRejectPaymentModal(false);
      setSuccessMessage('Payment rejected. Client has been notified to upload a new receipt.');
      setShowSuccessModal(true);
      fetchAppointments();
    } catch (err) {
      console.error('Error rejecting payment:', err);
      setSuccessMessage('Failed to reject payment');
      setShowSuccessModal(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRescheduleClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setRescheduleReason('');
    // Pre-fill with the original appointment date and time for easy adjustment
    const appointmentDate = new Date(appointment.appointment_date);
    setProposedDate(appointmentDate.toISOString().split('T')[0]); // Format: YYYY-MM-DD
    setProposedTime(appointment.appointment_time); // Format: HH:MM:SS or HH:MM
    setShowRescheduleModal(true);
  };

  const handleRescheduleSubmit = async () => {
    if (!selectedAppointment || !rescheduleReason.trim() || !proposedDate || !proposedTime) {
      setSuccessMessage('Please fill in all fields');
      setShowSuccessModal(true);
      return;
    }

    try {
      setActionLoading(true);
      await lawyerApi.requestReschedule(selectedAppointment.id, {
        proposed_date: proposedDate,
        proposed_time: proposedTime,
        reason: rescheduleReason,
      });
      setShowRescheduleModal(false);
      setSuccessMessage('Reschedule request sent to client successfully!');
      setShowSuccessModal(true);
      // Add a small delay to ensure backend has processed the request
      setTimeout(() => {
        fetchAppointments();
      }, 500);
    } catch (err: any) {
      console.error('Error requesting reschedule:', err);
      setShowRescheduleModal(false);
      setSuccessMessage(err.response?.data?.message || 'Failed to request reschedule');
      setShowSuccessModal(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRespondToClientReschedule = async (response: 'accept' | 'decline') => {
    if (!selectedAppointment) return;

    try {
      setActionLoading(true);
      await lawyerApi.respondToClientReschedule(selectedAppointment.id, response);
      setShowClientRescheduleModal(false);
      setSuccessMessage(
        response === 'accept'
          ? 'Reschedule request accepted! The appointment has been updated.'
          : 'Reschedule request declined. The original appointment remains unchanged.'
      );
      setShowSuccessModal(true);
      setTimeout(() => {
        fetchAppointments();
      }, 500);
    } catch (err: any) {
      console.error('Error responding to client reschedule:', err);
      setShowClientRescheduleModal(false);
      setSuccessMessage(err.response?.data?.message || 'Failed to respond to reschedule request');
      setShowSuccessModal(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkRescheduleClick = (date: string) => {
    // Get all confirmed appointments for this date that haven't been rescheduled
    const appointmentsOnDate = appointments.filter(apt =>
      apt.appointment_date.startsWith(date) &&
      apt.status === 'confirmed' &&
      !apt.reschedule_status
    );

    if (appointmentsOnDate.length === 0) {
      setSuccessMessage('No appointments available for bulk reschedule on this date');
      setShowSuccessModal(true);
      return;
    }

    setSelectedAppointmentIds(appointmentsOnDate.map(apt => apt.id));
    setBulkRescheduleDate(date);
    setRescheduleReason('');
    // Pre-fill with the same date and first appointment's time for easy adjustment
    setProposedDate(date); // Original date in YYYY-MM-DD format
    setProposedTime(appointmentsOnDate[0]?.appointment_time || ''); // Use first appointment's time
    setShowBulkRescheduleModal(true);
  };

  const handleBulkRescheduleSubmit = async () => {
    if (!rescheduleReason.trim() || !proposedDate || !proposedTime || selectedAppointmentIds.length === 0) {
      setSuccessMessage('Please fill in all fields');
      setShowSuccessModal(true);
      return;
    }

    try {
      setActionLoading(true);
      const response = await lawyerApi.bulkReschedule({
        original_date: bulkRescheduleDate,
        proposed_date: proposedDate,
        proposed_time: proposedTime,
        reason: rescheduleReason,
        appointment_ids: selectedAppointmentIds,
      });
      setShowBulkRescheduleModal(false);
      setSuccessMessage(response.message || `Successfully sent reschedule requests to ${response.rescheduled_count} client(s)`);
      setShowSuccessModal(true);
      // Add a small delay to ensure backend has processed the request
      setTimeout(() => {
        fetchAppointments();
      }, 500);
    } catch (err: any) {
      console.error('Error bulk rescheduling:', err);
      setShowBulkRescheduleModal(false);
      setSuccessMessage(err.response?.data?.message || 'Failed to bulk reschedule appointments');
      setShowSuccessModal(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleNotesClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setNotes(appointment.lawyer_notes || '');
    setShowNotesModal(true);
  };

  const handleNotesSave = async () => {
    if (!selectedAppointment) return;

    try {
      setActionLoading(true);
      await lawyerApi.addNotes(selectedAppointment.id, notes);
      setShowNotesModal(false);
      setSuccessMessage('Notes saved successfully!');
      setShowSuccessModal(true);
      fetchAppointments();
    } catch (err) {
      console.error('Error saving notes:', err);
      setSuccessMessage('Failed to save notes');
      setShowSuccessModal(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCaseTypeClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSelectedCaseTypeId(appointment.confirmed_specialization?.id || appointment.specialization?.id || null);
    setShowCaseTypeModal(true);
  };

  const handleCaseTypeSave = async () => {
    if (!selectedAppointment || !selectedCaseTypeId) return;

    try {
      setActionLoading(true);
      await lawyerApi.confirmSpecialization(selectedAppointment.id, selectedCaseTypeId);
      setShowCaseTypeModal(false);
      setSuccessMessage('Case type confirmed successfully!');
      setShowSuccessModal(true);
      fetchAppointments();
    } catch (err: any) {
      console.error('Error confirming case type:', err);
      setSuccessMessage(err.response?.data?.error || 'Failed to confirm case type');
      setShowSuccessModal(true);
    } finally {
      setActionLoading(false);
    }
  };

  // Simplified smart status for lawyers - matches client side
  const getSmartStatus = (appointment: Appointment) => {
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

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
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

  // Skeleton component for appointment cards
  const AppointmentSkeleton = () => (
    <div className="bg-white rounded-2xl border-2 border-gray-100 p-5 animate-pulse">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        {/* Left Side - Appointment Details */}
        <div className="flex-1 min-w-0">
          {/* Name and badges row */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0"></div>
              <div className="h-6 bg-gray-200 rounded-lg w-32"></div>
            </div>
            <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
            <div className="h-6 w-14 bg-gray-200 rounded-full"></div>
          </div>

          {/* Date/Time info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="flex items-center bg-gray-50 px-3 py-2 rounded-xl">
              <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
              <div className="h-4 bg-gray-200 rounded w-28"></div>
            </div>
            <div className="flex items-center bg-gray-50 px-3 py-2 rounded-xl">
              <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
              <div className="h-4 bg-gray-200 rounded w-40"></div>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
              <div className="h-4 bg-gray-200 rounded w-28"></div>
            </div>
          </div>
        </div>

        {/* Right Side - Price & Actions */}
        <div className="flex flex-col items-end gap-3">
          <div className="text-right">
            <div className="h-7 bg-gray-200 rounded w-24 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 bg-gray-200 rounded-xl w-24"></div>
            <div className="h-9 bg-gray-200 rounded-xl w-20"></div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-full overflow-x-hidden animate-fadeIn">
        {/* Header - Clean transparent style matching actual design */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2.5 bg-blue-100 rounded-xl">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Appointments</h1>
              </div>
              <p className="text-gray-500 ml-14">Manage your consultation schedule</p>
            </div>

            {/* Refresh button skeleton */}
            <div className="h-11 bg-gray-100 rounded-xl w-28 animate-pulse"></div>
          </div>
        </div>

        {/* Tabs - Enhanced matching actual design */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-2 mb-6">
          <nav className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => handleTabChange('all')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200/50' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              All
              <span className={`py-0.5 px-2 rounded-full text-xs ${
                activeTab === 'all' ? 'bg-white/20' : 'bg-gray-100'
              }`}>
                {allAppointments.length}
              </span>
            </button>
            <button
              onClick={() => handleTabChange('new')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === 'new' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200/50' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              New Booking
              <span className={`py-0.5 px-2 rounded-full text-xs ${
                activeTab === 'new' ? 'bg-white/20' : newBookingCount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100'
              }`}>
                {newBookingCount}
              </span>
            </button>
            <button
              onClick={() => handleTabChange('upcoming')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === 'upcoming' ? 'bg-purple-600 text-white shadow-lg shadow-purple-200/50' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Zap className="w-4 h-4" />
              Upcoming
              <span className={`py-0.5 px-2 rounded-full text-xs ${
                activeTab === 'upcoming' ? 'bg-white/20' : upcomingCount > 0 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100'
              }`}>
                {upcomingCount}
              </span>
            </button>
            <button
              onClick={() => handleTabChange('reschedule')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === 'reschedule' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200/50' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <CalendarClock className="w-4 h-4" />
              Reschedule
              <span className={`py-0.5 px-2 rounded-full text-xs ${
                activeTab === 'reschedule' ? 'bg-white/20' : allAppointments.filter(a => a.reschedule_status === 'pending').length > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100'
              }`}>
                {allAppointments.filter(a => a.reschedule_status === 'pending').length}
              </span>
            </button>
            <button
              onClick={() => handleTabChange('completed')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === 'completed' ? 'bg-green-600 text-white shadow-lg shadow-green-200/50' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Completed
              <span className={`py-0.5 px-2 rounded-full text-xs ${
                activeTab === 'completed' ? 'bg-white/20' : 'bg-gray-100'
              }`}>
                {allAppointments.filter(a => a.status === 'completed').length}
              </span>
            </button>
            <button
              onClick={() => handleTabChange('cancelled')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === 'cancelled' ? 'bg-red-600 text-white shadow-lg shadow-red-200/50' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <XCircle className="w-4 h-4" />
              Cancelled
              <span className={`py-0.5 px-2 rounded-full text-xs ${
                activeTab === 'cancelled' ? 'bg-white/20' : 'bg-gray-100'
              }`}>
                {allAppointments.filter(a => a.status === 'cancelled').length}
              </span>
            </button>
          </nav>
        </div>

        {/* Appointment Cards Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <AppointmentSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const formatRefreshTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    const displaySeconds = seconds.toString().padStart(2, '0');
    return `${displayHour}:${displayMinutes}:${displaySeconds} ${ampm}`;
  };

  return (
    <div className={`max-w-full overflow-x-hidden ${!isTabSwitching ? 'animate-fadeIn' : ''}`}>
      {/* Header - Clean transparent style */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 bg-blue-100 rounded-xl">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Appointments</h1>
            </div>
            <p className="text-gray-500 ml-14">Manage your consultation schedule</p>
          </div>

          {/* Manual refresh button - Enhanced */}
          <button
            onClick={() => fetchAppointments(true, true)}
            disabled={loading || isRefreshing}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-700 border-2 border-blue-200 rounded-xl hover:bg-blue-100 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs - Enhanced */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-2 mb-6">
        <nav className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <button
            onClick={() => handleTabChange('all')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200/50'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            All
            <span className={`py-0.5 px-2 rounded-full text-xs ${
              activeTab === 'all' ? 'bg-white/20' : 'bg-gray-100'
            }`}>
              {allAppointments.length}
            </span>
          </button>
          <button
            onClick={() => handleTabChange('new')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === 'new'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200/50'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            New Booking
            <span className={`py-0.5 px-2 rounded-full text-xs ${
              activeTab === 'new' ? 'bg-white/20' : newBookingCount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100'
            }`}>
              {newBookingCount}
            </span>
          </button>
          <button
            onClick={() => handleTabChange('upcoming')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === 'upcoming'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-200/50'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Zap className="w-4 h-4" />
            Upcoming
            <span className={`py-0.5 px-2 rounded-full text-xs ${
              activeTab === 'upcoming' ? 'bg-white/20' : upcomingCount > 0 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100'
            }`}>
              {upcomingCount}
            </span>
          </button>
          <button
            onClick={() => handleTabChange('reschedule')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === 'reschedule'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-200/50'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <CalendarClock className="w-4 h-4" />
            Reschedule
            <span className={`py-0.5 px-2 rounded-full text-xs ${
              activeTab === 'reschedule' ? 'bg-white/20' : allAppointments.filter(a => a.reschedule_status === 'pending').length > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100'
            }`}>
              {allAppointments.filter(a => a.reschedule_status === 'pending').length}
            </span>
          </button>
          <button
            onClick={() => handleTabChange('completed')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === 'completed'
                ? 'bg-green-600 text-white shadow-lg shadow-green-200/50'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Completed
            <span className={`py-0.5 px-2 rounded-full text-xs ${
              activeTab === 'completed' ? 'bg-white/20' : 'bg-gray-100'
            }`}>
              {allAppointments.filter(a => a.status === 'completed').length}
            </span>
          </button>
          <button
            onClick={() => handleTabChange('cancelled')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === 'cancelled'
                ? 'bg-red-600 text-white shadow-lg shadow-red-200/50'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <XCircle className="w-4 h-4" />
            Cancelled
            <span className={`py-0.5 px-2 rounded-full text-xs ${
              activeTab === 'cancelled' ? 'bg-white/20' : 'bg-gray-100'
            }`}>
              {allAppointments.filter(a => a.status === 'cancelled').length}
            </span>
          </button>
        </nav>
      </div>

      {/* Filter and Sort Controls - Enhanced */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-white p-4 rounded-2xl border-2 border-gray-100">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by client name..."
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <label className="text-sm text-gray-600 whitespace-nowrap font-medium">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'booking' | 'name')}
            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="booking">Booking Time</option>
            <option value="date">Appointment Date</option>
            <option value="name">Client Name</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center gap-2 transition-all"
            title={sortOrder === 'asc' ? 'Ascending (click to change)' : 'Descending (click to change)'}
          >
            <ArrowUpDown className="w-4 h-4" />
            {sortOrder === 'asc' ? (
              <span className="hidden sm:inline">{sortBy === 'name' ? 'A-Z' : 'Oldest'}</span>
            ) : (
              <span className="hidden sm:inline">{sortBy === 'name' ? 'Z-A' : 'Latest'}</span>
            )}
          </button>
        </div>
        {filterClient && (
          <button
            onClick={() => setFilterClient('')}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        )}
      </div>

      {/* Results info */}
      {filterClient && (
        <p className="text-sm text-gray-500 mb-3">
          Showing {sortedAppointments.length} of {appointments.length} appointments
        </p>
      )}

      {/* Bulk Reschedule Helper */}
      {(activeTab === 'all' || activeTab === 'upcoming' || activeTab === 'confirmed') && appointments.length > 0 && (() => {
        // Group appointments by date (only confirmed appointments)
        const appointmentsByDate: Record<string, Appointment[]> = {};
        appointments.forEach(apt => {
          // Only include confirmed appointments that haven't been rescheduled
          if (apt.status === 'confirmed' && !apt.reschedule_status) {
            const date = apt.appointment_date.split('T')[0];
            if (!appointmentsByDate[date]) {
              appointmentsByDate[date] = [];
            }
            appointmentsByDate[date].push(apt);
          }
        });

        // Find dates with multiple appointments that can be rescheduled
        const datesWithMultiple = Object.entries(appointmentsByDate)
          .filter(([_, apts]) => apts.length >= 2)
          .map(([date, apts]) => ({ date, count: apts.length }));

        return datesWithMultiple.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-yellow-900 mb-2">Bulk Reschedule Available</h4>
                <p className="text-xs text-yellow-700 mb-3">
                  You have multiple appointments on the same day. Reschedule them all at once:
                </p>
                <div className="flex flex-wrap gap-2">
                  {datesWithMultiple.map(({ date, count }) => (
                    <button
                      key={date}
                      onClick={() => handleBulkRescheduleClick(date)}
                      className="px-3 py-1.5 bg-yellow-600 text-white text-xs rounded-md hover:bg-yellow-700 transition-colors"
                    >
                      {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ({count} appointments)
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Appointments List */}
      {sortedAppointments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border-2 border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {filterClient ? 'No matching appointments' : 'No appointments'}
          </h3>
          <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
            {filterClient 
              ? `No appointments found for "${filterClient}"`
              : activeTab === 'all' 
              ? 'No appointments yet. They will appear here when clients book consultations.' 
              : activeTab === 'upcoming'
              ? 'No upcoming appointments in the next 3 days. Check back later!'
              : activeTab === 'reschedule'
              ? 'No pending reschedule requests at the moment.'
              : `No ${activeTab} appointments to display.`}
          </p>
          {filterClient && (
            <button
              onClick={() => setFilterClient('')}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white rounded-2xl border-2 border-gray-100 p-5 hover:shadow-lg hover:border-blue-200 transition-all duration-300"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                {/* Left Side - Appointment Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-white">
                          {appointment.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {appointment.user.name}
                      </h3>
                    </div>
                    {/* Show reschedule status badge if pending */}
                    {appointment.reschedule_status === 'pending' && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200 flex items-center gap-1">
                        <CalendarClock className="w-3 h-3" />
                        Reschedule Pending
                      </span>
                    )}
                    {/* Simplified smart status badge */}
                    {(() => {
                      const smartStatus = getSmartStatus(appointment);
                      return (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${smartStatus.color}`}>
                          {smartStatus.label}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Show selected case type / specialization OR missing notice */}
                  {(appointment.specialization || appointment.confirmed_specialization) ? (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 flex items-center gap-1.5 font-medium">
                        <FileText className="w-4 h-4" />
                        Case Type: {appointment.confirmed_specialization?.name || appointment.specialization?.name}
                        {appointment.confirmed_specialization && (
                          <CheckCircle2 className="w-4 h-4 text-green-600 ml-1" />
                        )}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1.5 font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Missing Case Type
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
                    <div className="flex items-center text-gray-600 min-w-0 bg-gray-50 px-3 py-2 rounded-xl">
                      <Calendar className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
                      <span className="font-medium truncate">{formatDate(appointment.appointment_date)}</span>
                    </div>

                    <div className="flex items-center text-gray-600 min-w-0 bg-gray-50 px-3 py-2 rounded-xl">
                      <Clock className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
                      <span className="font-medium truncate">{formatTime(appointment.appointment_time)}</span>
                      <span className="ml-2 text-gray-500 flex-shrink-0">({appointment.duration_minutes} mins)</span>
                    </div>

                    <div className="flex items-center text-gray-600 min-w-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{appointment.user.email}</span>
                    </div>

                    <div className="flex items-center text-gray-600 min-w-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="truncate">{appointment.user.phone}</span>
                    </div>
                  </div>

                  {/* Client Notes */}
                  {appointment.client_notes && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <p className="text-xs font-semibold text-blue-900 mb-1">Client Notes:</p>
                      <p className="text-sm text-blue-800">{appointment.client_notes}</p>
                    </div>
                  )}

                  {/* Lawyer Notes */}
                  {appointment.lawyer_notes && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                      <p className="text-xs font-semibold text-purple-900 mb-1">Your Notes:</p>
                      <p className="text-sm text-purple-800">{appointment.lawyer_notes}</p>
                    </div>
                  )}

                  {/* Cancellation Reason */}
                  {appointment.status === 'cancelled' && appointment.cancellation_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                      <p className="text-xs font-semibold text-red-900 mb-1">Cancellation Reason:</p>
                      <p className="text-sm text-red-800">{appointment.cancellation_reason}</p>
                    </div>
                  )}

                  {/* Reschedule Request Status */}
                  {appointment.reschedule_status === 'pending' && appointment.proposed_date && (
                    appointment.reschedule_requested_by === 'client' ? (
                      // Client requested reschedule - lawyer needs to respond
                      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-3 mb-3">
                        <p className="text-xs font-semibold text-blue-900 mb-2">Client Reschedule Request</p>
                        <p className="text-sm text-blue-800">
                          <strong>Requested Date:</strong> {formatDate(appointment.proposed_date)} at {formatTime(getTimeFromDateTime(appointment.proposed_date) || appointment.appointment_time)}
                        </p>
                        <p className="text-sm text-blue-800 mt-1">
                          <strong>Reason:</strong> {appointment.reschedule_reason}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setShowClientRescheduleModal(true);
                            }}
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Review Request
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Lawyer requested reschedule - waiting for client
                      <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-3 mb-3">
                        <p className="text-xs font-semibold text-orange-900 mb-2">Reschedule Request Sent</p>
                        <p className="text-sm text-orange-800">
                          <strong>New Date:</strong> {formatDate(appointment.proposed_date)} at {formatTime(getTimeFromDateTime(appointment.proposed_date) || appointment.appointment_time)}
                        </p>
                        <p className="text-sm text-orange-800 mt-1">
                          <strong>Reason:</strong> {appointment.reschedule_reason}
                        </p>
                        <p className="text-xs text-orange-700 mt-2">Waiting for client response...</p>
                      </div>
                    )
                  )}

                  {/* Reschedule Accepted */}
                  {appointment.reschedule_status === 'accepted' && (
                    <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-3 mb-3">
                      <p className="text-xs font-semibold text-green-900 mb-1">Reschedule Accepted</p>
                      <p className="text-sm text-green-800">Client accepted your reschedule request. Appointment updated.</p>
                    </div>
                  )}

                  {/* Reschedule Declined */}
                  {appointment.reschedule_status === 'declined' && (
                    <div className="bg-gray-50 border-l-4 border-gray-500 rounded-lg p-3 mb-3">
                      <p className="text-xs font-semibold text-gray-900 mb-1">Reschedule Declined</p>
                      <p className="text-sm text-gray-800">Client declined the reschedule. Appointment cancelled.</p>
                    </div>
                  )}

                  {/* Meeting Link */}
                  {appointment.meeting_link && appointment.status === 'confirmed' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                      <p className="text-xs font-semibold text-green-900 mb-1">Meeting Link:</p>
                      <a
                        href={appointment.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-green-700 hover:text-green-900 underline break-all"
                      >
                        {appointment.meeting_link}
                      </a>
                    </div>
                  )}
                </div>

                {/* Right Side - Fee and Actions */}
                <div className="w-full lg:w-auto lg:ml-6 flex flex-col lg:items-end space-y-3 border-t lg:border-t-0 pt-4 lg:pt-0 lg:flex-shrink-0 lg:min-w-[200px]">
                  {/* Fee Section */}
                  <div className="text-left lg:text-right mb-2 pb-3 border-b border-gray-100 w-full">
                    <p className="text-2xl font-bold text-gray-900">
                      ₱{(appointment.reservation_fee || 100).toLocaleString()}
                    </p>
                    {appointment.payment_status === 'paid' ? (
                      <p className="text-xs text-green-600 font-medium">Reservation Fee Paid</p>
                    ) : appointment.payment_proof ? (
                      <p className="text-xs text-orange-600 font-medium">Payment Proof Pending Review</p>
                    ) : (
                      <p className="text-xs text-red-600 font-medium">Reservation Fee Unpaid</p>
                    )}
                    {appointment.consultation_fee && (
                      <p className="text-xs text-gray-500 mt-1">
                        Balance Due: ₱{(appointment.consultation_fee - (appointment.reservation_fee || 100)).toLocaleString()}
                      </p>
                    )}
                    {appointment.payment_method && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        via {appointment.payment_method}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 w-full">
                    {/* Primary Action - Complete */}
                    {appointment.status === 'confirmed' && !appointment.reschedule_status && (
                      <button
                        onClick={() => handleCompleteClick(appointment)}
                        disabled={actionLoading}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Complete
                      </button>
                    )}

                    {/* Secondary Actions Row */}
                    {appointment.status === 'confirmed' && !appointment.reschedule_status && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRescheduleClick(appointment)}
                          disabled={actionLoading}
                          className="flex-1 bg-amber-500 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Resched
                        </button>
                        <button
                          onClick={() => handleDeclineClick(appointment)}
                          disabled={actionLoading}
                          className="flex-1 bg-red-500 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Decline
                        </button>
                      </div>
                    )}

                    {/* Show reschedule status */}
                    {appointment.reschedule_status === 'pending' && (
                      <div className="w-full bg-yellow-50 border border-yellow-300 px-4 py-2.5 rounded-xl text-xs">
                        <p className="font-semibold text-yellow-900">Awaiting Client Response</p>
                      </div>
                    )}

                    {/* Utility Buttons Row */}
                    {appointment.status !== 'cancelled' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleNotesClick(appointment)}
                          className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-xl text-xs font-medium hover:bg-gray-200 transition-all border border-gray-200 flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Notes
                        </button>
                        {appointment.status !== 'completed' && !appointment.specialization && !appointment.confirmed_specialization ? (
                          <button
                            onClick={() => handleCaseTypeClick(appointment)}
                            className="flex-1 bg-amber-100 text-amber-700 px-3 py-2 rounded-xl text-xs font-medium hover:bg-amber-200 transition-all border border-amber-200 flex items-center justify-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Assign
                          </button>
                        ) : appointment.status !== 'completed' ? (
                          <button
                            onClick={() => handleCaseTypeClick(appointment)}
                            className="flex-1 bg-purple-100 text-purple-700 px-3 py-2 rounded-xl text-xs font-medium hover:bg-purple-200 transition-all border border-purple-200 flex items-center justify-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Case
                          </button>
                        ) : (
                          <div className="flex-1"></div>
                        )}
                      </div>
                    )}

                    {/* Payment Proof Button */}
                    {appointment.payment_proof && (
                      <button
                        onClick={() => handleViewPaymentProof(appointment)}
                        className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                          appointment.payment_confirmed === true
                            ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200'
                            : appointment.payment_status === 'pending'
                            ? 'bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200 animate-pulse'
                            : 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {appointment.payment_confirmed === true && 'Receipt Confirmed ✓'}
                        {appointment.payment_confirmed === null && 'Review Receipt'}
                        {appointment.payment_confirmed === false && 'Receipt Rejected'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
              Add Notes - {selectedAppointment.user.name}
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter consultation notes, observations, recommendations..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4">
              <button
                onClick={() => setShowNotesModal(false)}
                className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleNotesSave}
                disabled={actionLoading}
                className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Case Type Modal */}
      {showCaseTypeModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
              Set Case Type - {selectedAppointment.user.name}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              {selectedAppointment.specialization 
                ? `Client selected: ${selectedAppointment.specialization.name}`
                : 'Client did not select a case type. Please determine the appropriate legal matter.'}
            </p>
            <div className="space-y-2 mb-4">
              {lawyerSpecializations.length > 0 ? (
                lawyerSpecializations.map((spec) => (
                  <label
                    key={spec.id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedCaseTypeId === spec.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="caseType"
                      value={spec.id}
                      checked={selectedCaseTypeId === spec.id}
                      onChange={() => setSelectedCaseTypeId(spec.id)}
                      className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-900">{spec.name}</span>
                  </label>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  <p>You don't have any specializations set up.</p>
                  <p className="mt-1">Please update your profile to add specializations.</p>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4">
              <button
                onClick={() => {
                  setShowCaseTypeModal(false);
                  setSelectedCaseTypeId(null);
                }}
                className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCaseTypeSave}
                disabled={actionLoading || !selectedCaseTypeId}
                className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Confirm Case Type'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {showDeclineModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
              Decline Appointment
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
              Please provide a reason for declining this appointment with {selectedAppointment.user.name}.
            </p>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="e.g., Schedule conflict, Not my area of expertise, etc."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            />
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4">
              <button
                onClick={() => setShowDeclineModal(false)}
                className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeclineSubmit}
                disabled={actionLoading || !declineReason.trim()}
                className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Declining...' : 'Decline Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Appointment Modal */}
      {showCompleteModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fadeIn">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Mark as Completed</h3>
                </div>
                <button
                  onClick={() => setShowCompleteModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Are you sure you want to mark this appointment as completed?
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">Appointment Details:</p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Client:</span> {selectedAppointment.user.name}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Date:</span> {formatDate(selectedAppointment.appointment_date)}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Time:</span> {formatTime(selectedAppointment.appointment_time)}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  What happens next:
                </h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Appointment status will change to "Completed"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Client will be able to leave a review</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Consultation fee will be finalized</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCompleteModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteSubmit}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Completing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Mark as Completed
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Appointment Modal */}
      {showRescheduleModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Request Reschedule
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Propose a new date and time for this appointment with {selectedAppointment.user.name}. The client can accept or decline.
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
              <p className="text-xs font-semibold text-gray-700 mb-1">Original Appointment:</p>
              <p className="text-sm text-gray-900">
                {new Date(selectedAppointment.appointment_date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })} at {selectedAppointment.appointment_time}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Date
                </label>
                <input
                  type="date"
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Time
                </label>
                <input
                  type="time"
                  value={proposedTime}
                  onChange={(e) => setProposedTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Reschedule
                </label>
                <textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="e.g., Emergency hearing, Court schedule conflict, Personal emergency"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> The client can accept the new date or decline the reschedule request.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRescheduleSubmit}
                disabled={actionLoading || !rescheduleReason.trim() || !proposedDate || !proposedTime}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
              >
                {actionLoading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Reschedule Modal */}
      {showBulkRescheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Bulk Reschedule Appointments
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Reschedule all {selectedAppointmentIds.length} appointment(s) on {new Date(bulkRescheduleDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} to a new date and time. Clients can accept or decline.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Date
                </label>
                <input
                  type="date"
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Time
                </label>
                <input
                  type="time"
                  value={proposedTime}
                  onChange={(e) => setProposedTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Reschedule
                </label>
                <textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="e.g., Emergency hearing, Court schedule conflict, Personal emergency"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> All {selectedAppointmentIds.length} clients will be notified. They can individually accept the new date or decline.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBulkRescheduleModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkRescheduleSubmit}
                disabled={actionLoading || !rescheduleReason.trim() || !proposedDate || !proposedTime}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
              >
                {actionLoading ? 'Sending...' : `Send to ${selectedAppointmentIds.length} Client(s)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Reschedule Response Modal */}
      {showClientRescheduleModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Client Reschedule Request
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              <strong>{selectedAppointment.user.name}</strong> has requested to reschedule their appointment.
            </p>

            {/* Current Appointment */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
              <p className="text-xs font-semibold text-gray-700 mb-1">Current Appointment:</p>
              <p className="text-sm text-gray-900">
                {formatDate(selectedAppointment.appointment_date)} at {formatTime(selectedAppointment.appointment_time)}
              </p>
            </div>

            {/* Proposed New Date */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs font-semibold text-blue-700 mb-1">Proposed New Date:</p>
              <p className="text-sm text-blue-900 font-semibold">
                {formatDate(selectedAppointment.proposed_date || '')} at {formatTime(getTimeFromDateTime(selectedAppointment.proposed_date || '') || selectedAppointment.appointment_time)}
              </p>
            </div>

            {/* Reason */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-700 mb-1">Client's Reason:</p>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-800">{selectedAppointment.reschedule_reason}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => handleRespondToClientReschedule('decline')}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50 font-medium"
              >
                {actionLoading ? 'Processing...' : 'Decline'}
              </button>
              <button
                onClick={() => handleRespondToClientReschedule('accept')}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                {actionLoading ? 'Processing...' : 'Accept'}
              </button>
            </div>

            <button
              onClick={() => {
                setShowClientRescheduleModal(false);
                setSelectedAppointment(null);
              }}
              className="w-full mt-3 px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Success/Error Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                successMessage.includes('successfully') || successMessage.includes('saved') || successMessage.includes('declined') || successMessage.includes('completed')
                  ? 'bg-green-100'
                  : successMessage.includes('Failed') || successMessage.includes('provide a reason') || successMessage.includes('failed')
                  ? 'bg-red-100'
                  : 'bg-yellow-100'
              }`}>
                {successMessage.includes('successfully') || successMessage.includes('saved') || successMessage.includes('declined') || successMessage.includes('completed') ? (
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : successMessage.includes('Failed') || successMessage.includes('provide a reason') || successMessage.includes('failed') ? (
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {successMessage.includes('successfully') || successMessage.includes('saved') || successMessage.includes('declined') || successMessage.includes('completed') ? 'Success' : 'Notice'}
              </h3>
              <p className="text-gray-600 mb-6">{successMessage}</p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Proof Modal */}
      {showPaymentProofModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Payment Receipt - {selectedAppointment.user.name}
              </h3>
              <button
                onClick={() => setShowPaymentProofModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Payment Info */}
            <div className="mb-4 bg-gray-50 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Reservation Fee:</span>
                  <span className="ml-2 font-semibold">₱{(selectedAppointment.reservation_fee || 100).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                    selectedAppointment.payment_confirmed === true
                      ? 'bg-green-100 text-green-700'
                      : selectedAppointment.payment_status === 'unpaid' && selectedAppointment.payment_confirmed === false
                      ? 'bg-red-100 text-red-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {selectedAppointment.payment_confirmed === true 
                      ? 'Confirmed' 
                      : selectedAppointment.payment_status === 'unpaid' && selectedAppointment.payment_confirmed === false
                      ? 'Rejected'
                      : 'Pending Confirmation'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Method:</span>
                  <span className="ml-2 capitalize">{selectedAppointment.payment_method_used || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Uploaded:</span>
                  <span className="ml-2">{selectedAppointment.payment_proof_uploaded_at 
                    ? new Date(selectedAppointment.payment_proof_uploaded_at).toLocaleString() 
                    : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Receipt Image */}
            {selectedAppointment.payment_proof && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Receipt:</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={`${STORAGE_URL}/storage/${selectedAppointment.payment_proof}`}
                    alt="Payment Receipt"
                    className="w-full h-auto max-h-96 object-contain bg-gray-100"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect fill="%23f3f4f6" width="200" height="150"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af">Image not found</text></svg>';
                    }}
                  />
                </div>
                <a
                  href={`${STORAGE_URL}/storage/${selectedAppointment.payment_proof}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open in new tab
                </a>
              </div>
            )}

            {/* Action Buttons - Only show if not yet confirmed or rejected */}
            {selectedAppointment.payment_confirmed !== true && !(selectedAppointment.payment_status === 'unpaid' && selectedAppointment.payment_confirmed === false) && (
              <div className="border-t pt-4 mt-4">
                <p className="text-sm text-gray-600 mb-3">
                  Please verify the payment receipt and confirm or reject the payment.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleRejectPaymentClick}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 text-red-700 bg-red-100 rounded-md hover:bg-red-200 disabled:opacity-50 transition-colors font-medium"
                  >
                    {actionLoading ? 'Processing...' : 'Reject Payment'}
                  </button>
                  <button
                    onClick={handleConfirmPayment}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                  >
                    {actionLoading ? 'Processing...' : 'Confirm Payment'}
                  </button>
                </div>
              </div>
            )}

            {/* Close button if already processed */}
            {(selectedAppointment.payment_confirmed === true || (selectedAppointment.payment_status === 'unpaid' && selectedAppointment.payment_confirmed === false)) && (
              <div className="border-t pt-4 mt-4">
                <button
                  onClick={() => setShowPaymentProofModal(false)}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default LawyerAppointments;