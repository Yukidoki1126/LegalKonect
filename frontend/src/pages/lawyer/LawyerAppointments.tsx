import React, { useEffect, useState } from 'react';
import { lawyerApi } from '../../services/lawyerApi';
import { useSearchParams } from 'react-router-dom';
import { cacheService } from '../../services/cacheService';

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
  user: User;
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [notes, setNotes] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isTabSwitching, setIsTabSwitching] = useState(false);

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

  // Auto-refresh appointments every 10 seconds for real-time updates
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchAppointments(false); // Silent refresh
    }, 10000); // 10 seconds (faster refresh)

    return () => clearInterval(intervalId);
  }, [activeTab]);

  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);

  const fetchAppointments = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      if (!showLoading) setIsRefreshing(true);

      const status = activeTab === 'all' ? undefined : activeTab;
      const data = await lawyerApi.getAppointments(status);
      setAppointments(data);

      // Fetch all appointments for badge counts
      if (activeTab === 'all') {
        setAllAppointments(data);
      } else {
        const allData = await lawyerApi.getAppointments(undefined);
        setAllAppointments(allData);
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

  if (loading) {
    // Show skeleton loading on initial page load (from sidebar)
    // Only show simple spinner when explicitly switching tabs
    if (!isTabSwitching) {
      return (
        <div className="max-w-full overflow-x-hidden animate-fadeIn">
          {/* Header Skeleton */}
          <div className="mb-6 animate-pulse">
            <div className="h-9 bg-gray-200 rounded-lg w-64 mb-2"></div>
            <div className="h-5 bg-gray-200 rounded-lg w-96"></div>
          </div>

          {/* Tabs Skeleton */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-gray-200 rounded-lg w-32"></div>
            ))}
          </div>

          {/* Appointments Grid Skeleton */}
          <div className="space-y-3 sm:space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-48"></div>
                  </div>
                  <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                </div>

                {/* Client Info */}
                <div className="mb-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-40"></div>
                  <div className="h-4 bg-gray-200 rounded w-36"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <div className="h-9 bg-gray-200 rounded-lg flex-1"></div>
                  <div className="h-9 bg-gray-200 rounded-lg flex-1"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Show simple spinner when switching tabs
    return (
      <div className="max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Appointments</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your consultation schedule</p>
            </div>

            {/* Manual refresh button */}
            <div className="flex items-center gap-2">
              <button
                disabled
                className="p-2 text-gray-400 rounded-full cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-4 sm:mb-6 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <nav className="flex space-x-3 sm:space-x-6 md:space-x-8 min-w-max pb-px">
            {['all', 'completed', 'cancelled'].map((tab) => (
              <button
                key={tab}
                disabled
                className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-400'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className="ml-1 sm:ml-2 py-0.5 px-1.5 sm:px-2 rounded-full bg-gray-100 text-xs">
                  {tab === 'all'
                    ? allAppointments.length
                    : allAppointments.filter(a => a.status === tab).length}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Simple loading indicator */}
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
            <p className="text-gray-600 font-medium">Loading appointments...</p>
          </div>
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
      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Appointments</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your consultation schedule</p>
          </div>

          {/* Manual refresh button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAppointments(true)}
              disabled={loading || isRefreshing}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh now"
            >
              <svg className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4 sm:mb-6 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <nav className="flex space-x-3 sm:space-x-6 md:space-x-8 min-w-max pb-px">
          {['all', 'completed', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className="ml-1 sm:ml-2 py-0.5 px-1.5 sm:px-2 rounded-full bg-gray-100 text-xs">
                {tab === 'all'
                  ? allAppointments.length
                  : allAppointments.filter(a => a.status === tab).length}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <div className="text-center py-8 sm:py-12 bg-white rounded-lg border border-gray-200">
          <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            {activeTab === 'all' ? 'No appointments yet' : `No ${activeTab} appointments`}
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6 hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                {/* Left Side - Appointment Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      {appointment.user.name}
                    </h3>
                    {/* Only show status badge if not confirmed (since all appointments are auto-confirmed) */}
                    {appointment.status !== 'confirmed' && (
                      <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium ${getStatusBadge(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    )}
                    <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium ${getPaymentBadge(appointment.payment_status)}`}>
                      {appointment.payment_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm mb-3 sm:mb-4">
                    <div className="flex items-center text-gray-600 min-w-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium truncate">{formatDate(appointment.appointment_date)}</span>
                    </div>

                    <div className="flex items-center text-gray-600 min-w-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium truncate">{formatTime(appointment.appointment_time)}</span>
                      <span className="ml-1 sm:ml-2 text-gray-500 flex-shrink-0">({appointment.duration_minutes} mins)</span>
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
                  <div className="flex flex-col gap-2 w-full lg:w-auto lg:min-w-[160px]">
                    {appointment.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => handleCompleteClick(appointment)}
                          disabled={actionLoading}
                          className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          ✓ Mark Complete
                        </button>
                        <button
                          onClick={() => handleDeclineClick(appointment)}
                          disabled={actionLoading}
                          className="w-full bg-red-600 text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          ✕ Decline
                        </button>
                      </>
                    )}

                    {/* Add/Edit Notes Button */}
                    {appointment.status !== 'cancelled' && (
                      <button
                        onClick={() => handleNotesClick(appointment)}
                        className="w-full bg-gray-100 text-gray-700 px-4 py-2.5 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors border border-gray-300"
                      >
                        📝 {appointment.lawyer_notes ? 'Edit Notes' : 'Add Notes'}
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