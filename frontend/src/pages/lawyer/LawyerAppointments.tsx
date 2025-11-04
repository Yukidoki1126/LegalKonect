import React, { useEffect, useState } from 'react';
import { lawyerApi } from '../../services/lawyerApi';
import { useSearchParams } from 'react-router-dom';

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
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchAppointments(true);
  }, [activeTab]);

  // Auto-refresh appointments every 15 seconds for real-time updates
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchAppointments(false); // Silent refresh
    }, 15000); // 15 seconds

    return () => clearInterval(intervalId);
  }, [activeTab]);

  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);

  const fetchAppointments = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
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
    } catch (err) {
      console.error('Error fetching appointments:', err);
      if (showLoading) alert('Failed to load appointments');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ status: tab });
    }
  };

  const handleAcceptClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowAcceptModal(true);
  };

  const handleAcceptConfirm = async () => {
    if (!selectedAppointment) return;

    try {
      setActionLoading(true);
      await lawyerApi.acceptAppointment(selectedAppointment.id);
      setShowAcceptModal(false);
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (err) {
      console.error('Error accepting appointment:', err);
      alert('Failed to accept appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDeclineReason('');
    setShowDeclineModal(true);
  };

  const handleDeclineSubmit = async () => {
    if (!declineReason.trim()) {
      alert('Please provide a reason for declining');
      return;
    }

    if (!selectedAppointment) return;

    try {
      setActionLoading(true);
      await lawyerApi.declineAppointment(selectedAppointment.id, declineReason);
      alert('Appointment declined');
      setShowDeclineModal(false);
      fetchAppointments();
    } catch (err) {
      console.error('Error declining appointment:', err);
      alert('Failed to decline appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (appointment: Appointment) => {
    if (!window.confirm('Mark this appointment as completed?')) return;

    try {
      setActionLoading(true);
      await lawyerApi.completeAppointment(appointment.id);
      alert('Appointment marked as completed!');
      fetchAppointments();
    } catch (err) {
      console.error('Error completing appointment:', err);
      alert('Failed to complete appointment');
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
      alert('Notes saved successfully!');
      setShowNotesModal(false);
      fetchAppointments();
    } catch (err) {
      console.error('Error saving notes:', err);
      alert('Failed to save notes');
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
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Appointments</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your consultation schedule</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4 sm:mb-6 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <nav className="flex space-x-3 sm:space-x-6 md:space-x-8 min-w-max pb-px">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((tab) => (
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
                    <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium ${getStatusBadge(appointment.status)}`}>
                      {appointment.status}
                    </span>
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
                    <p className="text-xs text-gray-500">
                      {appointment.payment_method || 'N/A'}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 w-full lg:w-auto lg:min-w-[160px]">
                    {appointment.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAcceptClick(appointment)}
                          disabled={actionLoading}
                          className="w-full bg-green-600 text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          ✓ Accept
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

                    {appointment.status === 'confirmed' && (
                      <button
                        onClick={() => handleComplete(appointment)}
                        disabled={actionLoading}
                        className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        ✓ Mark Complete
                      </button>
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

      {/* Accept Appointment Modal */}
      {showAcceptModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
              Accept Appointment
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              Are you sure you want to accept this appointment with{' '}
              <span className="font-semibold">{selectedAppointment.user.name}</span>?
            </p>
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-center text-xs sm:text-sm text-gray-700 mb-2">
                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatDate(selectedAppointment.appointment_date)}</span>
              </div>
              <div className="flex items-center text-xs sm:text-sm text-gray-700">
                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formatTime(selectedAppointment.appointment_time)} ({selectedAppointment.duration_minutes} mins)</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setShowAcceptModal(false);
                  setSelectedAppointment(null);
                }}
                disabled={actionLoading}
                className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptConfirm}
                disabled={actionLoading}
                className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Accepting...</span>
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    <span>Accept Appointment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LawyerAppointments;