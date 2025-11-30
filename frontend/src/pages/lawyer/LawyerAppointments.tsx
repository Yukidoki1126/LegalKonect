import React, { useEffect, useState, useMemo } from 'react';
import { lawyerApi } from '../../services/lawyerApi';
import { useSearchParams } from 'react-router-dom';
import { cacheService } from '../../services/cacheService';
import { notificationService } from '../../services/notificationService';
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
  FileText
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
  meeting_type: string;
  meeting_link: string;
  reschedule_status?: string | null;
  reschedule_reason?: string | null;
  original_date?: string | null;
  proposed_date?: string | null;
  user: User;
  specialization?: { id: number; name: string } | null;
  confirmed_specialization?: { id: number; name: string } | null;
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
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // Default: Latest First
  const [filterClient, setFilterClient] = useState('');

  // Fetch lawyer's specializations on mount
  useEffect(() => {
    const fetchSpecializations = async () => {
      try {
        const specs = await lawyerApi.getSpecializations();
        setLawyerSpecializations(specs);
      } catch (error) {
        console.error('Failed to fetch specializations:', error);
      }
    };
    fetchSpecializations();
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
      fetchAppointments(false); // Silent refresh
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

  const fetchAppointments = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      if (!showLoading) setIsRefreshing(true);

      // Always fetch all appointments first to ensure accurate badge counts
      const allData = await lawyerApi.getAppointments(undefined);
      setAllAppointments(allData);

      // Then filter for display based on active tab
      if (activeTab === 'all') {
        setAppointments(allData);
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
      if (sortBy === 'date') {
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

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentBadge = (status: string) => {
    return status === 'paid' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-orange-100 text-orange-800';
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
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm ${
              activeTab === 'all' ? 'bg-blue-600 text-white' : 'text-gray-400 bg-gray-50'
            }`}>
              <FileText className="w-4 h-4" />
              All
              <span className={`py-0.5 px-2 rounded-full text-xs ${
                activeTab === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}>
                {allAppointments.length}
              </span>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm ${
              activeTab === 'reschedule' ? 'bg-orange-500 text-white' : 'text-gray-400 bg-gray-50'
            }`}>
              <CalendarClock className="w-4 h-4" />
              Reschedule
              <span className={`py-0.5 px-2 rounded-full text-xs ${
                activeTab === 'reschedule' ? 'bg-orange-400 text-white' : 'bg-gray-200'
              }`}>
                {allAppointments.filter(a => a.reschedule_status === 'pending').length}
              </span>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm ${
              activeTab === 'completed' ? 'bg-green-500 text-white' : 'text-gray-400 bg-gray-50'
            }`}>
              <CheckCircle2 className="w-4 h-4" />
              Completed
              <span className={`py-0.5 px-2 rounded-full text-xs ${
                activeTab === 'completed' ? 'bg-green-400 text-white' : 'bg-gray-200'
              }`}>
                {allAppointments.filter(a => a.status === 'completed').length}
              </span>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm ${
              activeTab === 'cancelled' ? 'bg-red-500 text-white' : 'text-gray-400 bg-gray-50'
            }`}>
              <XCircle className="w-4 h-4" />
              Cancelled
              <span className={`py-0.5 px-2 rounded-full text-xs ${
                activeTab === 'cancelled' ? 'bg-red-400 text-white' : 'bg-gray-200'
              }`}>
                {allAppointments.filter(a => a.status === 'cancelled').length}
              </span>
            </div>
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
            onClick={() => fetchAppointments(true)}
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
            onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="date">Date</option>
            <option value="name">Client Name</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center gap-2 transition-all"
            title={sortOrder === 'asc' ? 'Ascending (click to change)' : 'Descending (click to change)'}
          >
            <ArrowUpDown className="w-4 h-4" />
            {sortOrder === 'asc' ? (
              <span className="hidden sm:inline">{sortBy === 'date' ? 'Earliest' : 'A-Z'}</span>
            ) : (
              <span className="hidden sm:inline">{sortBy === 'date' ? 'Latest' : 'Z-A'}</span>
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
      {(activeTab === 'all' || activeTab === 'confirmed') && appointments.length > 0 && (() => {
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
                    {/* Only show status badge if not confirmed (since all appointments are auto-confirmed) */}
                    {appointment.status !== 'confirmed' && (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentBadge(appointment.payment_status)}`}>
                      {appointment.payment_status}
                    </span>
                  </div>

                  {/* Show selected case type / specialization */}
                  {(appointment.specialization || appointment.confirmed_specialization) && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 flex items-center gap-1.5 font-medium">
                        <FileText className="w-4 h-4" />
                        Case Type: {appointment.confirmed_specialization?.name || appointment.specialization?.name}
                        {appointment.confirmed_specialization && (
                          <CheckCircle2 className="w-4 h-4 text-green-600 ml-1" />
                        )}
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
                    <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-3 mb-3">
                      <p className="text-xs font-semibold text-orange-900 mb-2">Reschedule Request Sent</p>
                      <p className="text-sm text-orange-800">
                        <strong>New Date:</strong> {formatDate(appointment.proposed_date)} at {formatTime(appointment.proposed_date.split(' ')[1] || appointment.appointment_time)}
                      </p>
                      <p className="text-sm text-orange-800 mt-1">
                        <strong>Reason:</strong> {appointment.reschedule_reason}
                      </p>
                      <p className="text-xs text-orange-700 mt-2">Waiting for client response...</p>
                    </div>
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
                      <p className="text-sm text-gray-800">Client declined the reschedule. Appointment cancelled and refunded.</p>
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
                <div className="w-full lg:w-auto lg:ml-6 flex flex-col lg:items-end space-y-2 sm:space-y-3 border-t lg:border-t-0 pt-3 lg:pt-0 lg:flex-shrink-0">
                  <div className="text-left lg:text-right mb-1">
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                      ₱{appointment.consultation_fee.toLocaleString()}
                    </p>
                    {appointment.payment_status === 'paid' && appointment.reservation_fee && (
                      <p className="text-xs text-gray-600 mt-0.5">
                        Received: ₱{appointment.reservation_fee.toLocaleString()} |
                        Balance: ₱{(appointment.consultation_fee - appointment.reservation_fee).toLocaleString()}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {appointment.payment_method || 'N/A'}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 w-full lg:w-auto lg:min-w-[150px]">
                    {appointment.status === 'confirmed' && !appointment.reschedule_status && (
                      <>
                        <button
                          onClick={() => handleCompleteClick(appointment)}
                          disabled={actionLoading}
                          className="w-full bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Complete
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleRescheduleClick(appointment)}
                            disabled={actionLoading}
                            className="bg-yellow-500 text-white px-2 py-1.5 rounded-md text-xs font-medium hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Resched
                          </button>
                          <button
                            onClick={() => handleDeclineClick(appointment)}
                            disabled={actionLoading}
                            className="bg-red-500 text-white px-2 py-1.5 rounded-md text-xs font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Decline
                          </button>
                        </div>
                      </>
                    )}

                    {/* Show reschedule status */}
                    {appointment.reschedule_status === 'pending' && (
                      <div className="w-full bg-yellow-50 border border-yellow-300 px-3 py-2 rounded-md text-xs">
                        <p className="font-medium text-yellow-900">Awaiting Response</p>
                      </div>
                    )}

                    {/* Secondary action buttons */}
                    {appointment.status !== 'cancelled' && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleNotesClick(appointment)}
                          className="bg-gray-100 text-gray-700 px-2 py-1.5 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors border border-gray-300 flex items-center justify-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Notes
                        </button>
                        {appointment.status !== 'completed' ? (
                          <button
                            onClick={() => handleCaseTypeClick(appointment)}
                            className="bg-purple-100 text-purple-700 px-2 py-1.5 rounded-md text-xs font-medium hover:bg-purple-200 transition-colors border border-purple-300 flex items-center justify-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Case
                          </button>
                        ) : (
                          <div></div>
                        )}
                      </div>
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
              {lawyerSpecializations.map((spec) => (
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
              ))}
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
              Propose a new date and time for this appointment with {selectedAppointment.user.name}. The client can accept or decline. If declined, they will receive a full refund.
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
                  <strong>Note:</strong> The client can accept the new date or decline and receive a full ₱{selectedAppointment.reservation_fee || 100} refund.
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
                  <strong>Note:</strong> All {selectedAppointmentIds.length} clients will be notified. They can individually accept the new date or decline and receive a full refund.
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

    </div>
  );
};

export default LawyerAppointments;