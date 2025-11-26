import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import CustomCalendar from './CustomCalendar';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lawyer: {
    id: number;
    first_name: string;
    last_name: string;
    hourly_rate: number;
    reservation_fee?: number;
    specializations?: Array<{ name: string }>;
  };
}

interface TimeSlot {
  time: string;
  formatted_time: string;
  available: boolean;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, lawyer }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [meetingType, setMeetingType] = useState('in-person');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showRedirectScreen, setShowRedirectScreen] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Ref to track the current AbortController for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get maximum date (3 months from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    const year = maxDate.getFullYear();
    const month = String(maxDate.getMonth() + 1).padStart(2, '0');
    const day = String(maxDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchAvailableSlots = async () => {
    if (!selectedDate) return;

    // Cancel any pending request before starting a new one
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create a new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Clear old slots immediately to prevent flickering
    setAvailableSlots([]);
    setSelectedTime('');
    setLoadingSlots(true);
    setError('');

    try {
      const response = await api.get(`/lawyers/${lawyer.id}/available-slots`, {
        params: { date: selectedDate },
        signal: abortController.signal  // Pass the abort signal to the request
      });

      // Only update state if this request wasn't aborted
      if (!abortController.signal.aborted) {
        if (response.data.available) {
          setAvailableSlots(response.data.slots);
        } else {
          setAvailableSlots([]);
          setError(response.data.message || 'No slots available for this date');
        }
      }
    } catch (err: any) {
      // Ignore abort errors (these are expected when switching dates quickly)
      if (err.name === 'CanceledError' || err.message?.includes('cancel')) {
        return;
      }

      // Only show error if this request wasn't aborted
      if (!abortController.signal.aborted) {
        setError('Failed to load available time slots');
        setAvailableSlots([]);
      }
    } finally {
      // Only clear loading state if this request wasn't aborted
      if (!abortController.signal.aborted) {
        setLoadingSlots(false);
      }
    }
  };

  // Fetch available slots when date changes
  useEffect(() => {
    // Clear slots and selected time immediately when date changes
    setAvailableSlots([]);
    setSelectedTime('');
    setError('');

    if (selectedDate) {
      fetchAvailableSlots();
    }

    // Cleanup function: cancel any pending requests when component unmounts or date changes
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Handle countdown and redirect
  useEffect(() => {
    if (showRedirectScreen && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showRedirectScreen && countdown === 0) {
      // Redirect to payment page
      const appointmentId = (window as any).pendingAppointmentId;
      onClose();
      window.location.href = `/appointments/${appointmentId}/payment`;
    }
  }, [showRedirectScreen, countdown, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime) {
      setError('Please select both date and time');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/appointments', {
        lawyer_id: lawyer.id,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        client_notes: clientNotes,
        meeting_type: meetingType,
      });

      const appointmentId = response.data.id || response.data.appointment?.id;

      // Cancel any pending calendar requests to prevent errors during redirect
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Show redirect screen with countdown
      setLoading(false);
      setShowRedirectScreen(true);
      setCountdown(3);

      // Store appointmentId for redirect
      (window as any).pendingAppointmentId = appointmentId;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to book appointment';
      setError(errorMessage);

      // If the time slot was already booked, refresh the available slots
      if (errorMessage.includes('already been booked') || errorMessage.includes('no longer available')) {
        setSelectedTime(''); // Clear the selected time
        fetchAvailableSlots(); // Refresh available slots to show updated availability
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedDate('');
    setSelectedTime('');
    setClientNotes('');
    setMeetingType('in-person');
    setError('');
    setAvailableSlots([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Book Appointment
              </h2>
              <p className="text-gray-600 mt-1">
                with {lawyer.first_name} {lawyer.last_name}
              </p>
              {lawyer.specializations && lawyer.specializations.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {lawyer.specializations.map(s => s.name).join(', ')}
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LEFT COLUMN - Calendar */}
                <div className="space-y-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Select Date
                    </h3>
                    <CustomCalendar
                      selectedDate={selectedDate}
                      onDateSelect={setSelectedDate}
                      minDate={getMinDate()}
                      maxDate={getMaxDate()}
                      lawyerId={lawyer.id}
                    />
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs text-amber-800 flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Appointments must be booked at least 24 hours in advance</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN - Details */}
                <div className="space-y-4">
                  {/* Meeting Type */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Meeting Type
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'in-person', icon: '🏢', label: 'In-Person', disabled: false },
                        { value: 'video', icon: '💻', label: 'Video Call', badge: 'Coming Soon', disabled: true }
                      ].map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => !type.disabled && setMeetingType(type.value)}
                          disabled={type.disabled}
                          className={`px-4 py-3 rounded-lg border-2 text-sm font-semibold transition-all flex flex-col items-center gap-2 relative ${
                            meetingType === type.value && !type.disabled
                              ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                              : type.disabled
                              ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'
                              : 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50 text-gray-700'
                          }`}
                        >
                          <span className="text-2xl">{type.icon}</span>
                          <span>{type.label}</span>
                          {type.badge && (
                            <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap shadow-sm">
                              {type.badge}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Reason for Consultation
                      <span className="text-xs font-normal text-gray-500">(Optional)</span>
                    </h3>
                    <textarea
                      value={clientNotes}
                      onChange={(e) => setClientNotes(e.target.value)}
                      rows={4}
                      placeholder="Brief description of your legal matter..."
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      maxLength={1000}
                    />
                    <p className="text-xs text-gray-500 mt-2 text-right">
                      {clientNotes.length}/1000 characters
                    </p>
                  </div>

                  {/* Time Slots - Only shown after date is selected */}
                  {selectedDate && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Select Time Slot
                      </h3>
                      {loadingSlots ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="text-gray-600 mt-3 text-sm">Loading available slots...</p>
                        </div>
                      ) : availableSlots.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot.time}
                              type="button"
                              onClick={() => setSelectedTime(slot.time)}
                              className={`px-4 py-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                                selectedTime === slot.time
                                  ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                                  : 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50 text-gray-700'
                              }`}
                            >
                              {slot.formatted_time}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-gray-600 font-medium text-sm">No available slots</p>
                          <p className="text-gray-500 text-xs mt-1">Please select a different date</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Price Summary - Full Width */}
              <div className="mt-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border-2 border-blue-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Fee Summary
                </h3>

                <div className="space-y-4">
                  {/* Consultation Fee */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Total Consultation Fee</p>
                        <p className="text-xs text-gray-500 mt-0.5">Full session (1 hour)</p>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">
                        ₱{lawyer.hourly_rate.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Reservation Fee */}
                  <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-green-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          Reservation Fee
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">PAY NOW</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">Balance due at office: ₱{(lawyer.hourly_rate - (lawyer.reservation_fee || 100)).toLocaleString()}</p>
                      </div>
                      <span className="text-2xl font-bold text-green-600">
                        ₱{(lawyer.reservation_fee || 100).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Info Banner */}
                  <div className="bg-blue-100 border border-blue-300 rounded-lg p-3">
                    <p className="text-xs text-blue-900 flex items-start gap-2">
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Reservation fee will be processed after the lawyer confirms your appointment. The remaining balance should be paid at the law office.</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              <div className="mt-4 space-y-4">

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !selectedDate || !selectedTime}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Booking...' : 'Confirm Booking'}
                  </button>
                </div>
              </div>
            </form>
        </div>
      </div>

      {/* Redirect Screen with Countdown */}
      {showRedirectScreen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center shadow-2xl">
            {/* Success Icon */}
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Success Message */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Booking Successful!
            </h3>
            <p className="text-gray-600 mb-6">
              Your appointment has been booked successfully.
            </p>

            {/* Countdown */}
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-3">
                <span className="text-3xl font-bold text-blue-600">{countdown}</span>
              </div>
              <p className="text-sm text-gray-600">
                Redirecting to payment page...
              </p>
            </div>

            {/* Loading Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                style={{ width: `${((3 - countdown) / 3) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingModal;