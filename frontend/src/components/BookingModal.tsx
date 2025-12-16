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
    specializations?: Array<{ id: number; name: string }>;
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
  const [selectedSpecialization, setSelectedSpecialization] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showRedirectScreen, setShowRedirectScreen] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [limitReached, setLimitReached] = useState(false);
  const [dailyLimitInfo, setDailyLimitInfo] = useState<{ limit: number; booked: number } | null>(null);

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
          setLimitReached(false);
          setDailyLimitInfo(null);
        } else {
          setAvailableSlots([]);

          // Check if daily limit was reached
          if (response.data.limit_reached) {
            setLimitReached(true);
            setDailyLimitInfo({
              limit: response.data.daily_limit,
              booked: response.data.booked_count
            });
          } else {
            setLimitReached(false);
            setDailyLimitInfo(null);
          }
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

    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to book an appointment. Redirecting to login...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
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
        specialization_id: selectedSpecialization,
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
      let errorMessage = err.response?.data?.message || 'Failed to book appointment';
      
      // Handle authentication errors specifically
      if (err.response?.status === 401 || errorMessage.toLowerCase().includes('unauthenticated')) {
        errorMessage = 'Your session has expired. Please log in again.';
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }, 2000);
      }
      
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
    setLimitReached(false);
    setDailyLimitInfo(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto shadow-2xl border border-gray-100">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Book Appointment
                </h2>
              </div>
              <p className="text-gray-600 mt-1 ml-13">
                with <span className="font-semibold text-gray-800">{lawyer.first_name} {lawyer.last_name}</span>
              </p>
              {lawyer.specializations && lawyer.specializations.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 ml-13">
                  {lawyer.specializations.map(s => (
                    <span key={s.id} className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      {s.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
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
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 p-6 shadow-soft">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      Select Date
                    </h3>
                    <CustomCalendar
                      selectedDate={selectedDate}
                      onDateSelect={setSelectedDate}
                      minDate={getMinDate()}
                      maxDate={getMaxDate()}
                      lawyerId={lawyer.id}
                    />
                    <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl">
                      <p className="text-sm text-amber-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span>Appointments must be booked at least <strong>24 hours</strong> in advance</span>
                      </p>
                    </div>
                  </div>

                  {/* Fee Summary - Below Calendar */}
                  <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-6 shadow-soft">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      Fee Summary
                    </h3>

                    <div className="space-y-4">
                      {/* Total Fee */}
                      <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Total Consultation Fee</p>
                          <p className="text-xs text-gray-500 mt-0.5">Full session (1 hour)</p>
                        </div>
                        <span className="text-xl font-bold text-gray-900">
                          ₱{lawyer.hourly_rate.toLocaleString()}
                        </span>
                      </div>

                      {/* Reservation Fee - Pay Now */}
                      <div className="flex justify-between items-center bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900">Reservation Fee</p>
                            <span className="px-2 py-0.5 text-xs font-bold bg-green-600 text-white rounded-full animate-pulse">PAY NOW</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            Balance due at office: <span className="font-semibold">₱{(lawyer.hourly_rate - (lawyer.reservation_fee || 100)).toLocaleString()}</span>
                          </p>
                        </div>
                        <span className="text-2xl font-bold text-green-600">
                          ₱{(lawyer.reservation_fee || 100).toLocaleString()}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex items-start gap-2 pt-2">
                        <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs text-gray-500">
                          Reservation fee will be processed after the lawyer confirms your appointment.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN - Details */}
                <div className="space-y-4">
                  {/* Legal Matter Type (Specialization) - Optional */}
                  {lawyer.specializations && lawyer.specializations.length > 0 && (
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 p-6 shadow-soft">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        Type of Legal Matter
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">Optional</span>
                      </h3>
                      <select
                        value={selectedSpecialization || ''}
                        onChange={(e) => setSelectedSpecialization(e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-4 py-3.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-white transition-all duration-200 hover:border-gray-300 cursor-pointer"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem', appearance: 'none' }}
                      >
                        <option value="">I'm not sure / General consultation</option>
                        {lawyer.specializations.map((spec) => (
                          <option key={spec.id} value={spec.id}>
                            {spec.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Don't worry if you're unsure - the lawyer can help determine this.
                      </p>
                    </div>
                  )}

                  {/* Meeting Type */}
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 p-6 shadow-soft">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      Meeting Type
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { value: 'in-person', icon: '🏢', label: 'In-Person', disabled: false },
                        { value: 'video', icon: '💻', label: 'Video Call', badge: 'Coming Soon', disabled: true }
                      ].map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => !type.disabled && setMeetingType(type.value)}
                          disabled={type.disabled}
                          className={`px-4 py-4 rounded-xl border-2 text-sm font-semibold transition-all flex flex-col items-center gap-2 relative ${
                            meetingType === type.value && !type.disabled
                              ? 'border-blue-600 bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg scale-[1.02]'
                              : type.disabled
                              ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'
                              : 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50 text-gray-700 hover:scale-[1.02]'
                          }`}
                        >
                          <span className="text-3xl">{type.icon}</span>
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

                  {/* Time Slots - Only shown after date is selected */}
                  {selectedDate && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6 shadow-soft">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        Select Time Slot
                        {selectedTime && (
                          <span className="ml-auto text-sm text-blue-600 font-medium">✓ Selected</span>
                        )}
                      </h3>
                      {loadingSlots ? (
                        <div className="text-center py-10 bg-white/60 rounded-xl">
                          <div className="relative w-12 h-12 mx-auto">
                            <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                          </div>
                          <p className="text-gray-600 mt-4 text-sm font-medium">Loading available slots...</p>
                        </div>
                      ) : availableSlots.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot.time}
                              type="button"
                              onClick={() => slot.available && setSelectedTime(slot.time)}
                              disabled={!slot.available}
                              className={`px-4 py-3.5 rounded-2xl border-2 text-sm font-semibold transition-all ${
                                !slot.available
                                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed line-through opacity-60'
                                  : selectedTime === slot.time
                                  ? 'border-blue-600 bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg scale-[1.02]'
                                  : 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50 text-gray-700 hover:scale-[1.02]'
                              }`}
                              title={!slot.available ? 'This time slot is already booked' : ''}
                            >
                              {slot.formatted_time}
                              {!slot.available && (
                                <span className="block text-xs font-normal mt-0.5">Booked</span>
                              )}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className={`text-center py-8 rounded-lg border-2 border-dashed ${
                          limitReached ? 'bg-orange-50 border-orange-300' : 'bg-gray-50 border-gray-300'
                        }`}>
                          {limitReached ? (
                            <>
                              <svg className="w-12 h-12 text-orange-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <p className="text-orange-700 font-medium text-sm">Daily Appointment Limit Reached</p>
                              {dailyLimitInfo && (
                                <p className="text-orange-600 text-xs mt-2">
                                  This lawyer has reached their maximum of {dailyLimitInfo.limit} appointment{dailyLimitInfo.limit > 1 ? 's' : ''} for this day
                                </p>
                              )}
                              <p className="text-gray-600 text-xs mt-2">Please select a different date</p>
                            </>
                          ) : (
                            <>
                              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-gray-600 font-medium text-sm">No available slots</p>
                              <p className="text-gray-500 text-xs mt-1">Please select a different date</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 p-6 shadow-soft">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      Reason for Consultation
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">Optional</span>
                    </h3>
                    <textarea
                      value={clientNotes}
                      onChange={(e) => setClientNotes(e.target.value)}
                      rows={4}
                      placeholder="Brief description of your legal matter..."
                      className="w-full px-4 py-3.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 resize-none transition-all duration-200 hover:border-gray-300"
                      maxLength={1000}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-gray-400">Helps the lawyer prepare for your consultation</p>
                      <p className="text-xs text-gray-500 font-medium">
                        {clientNotes.length}/1000
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              <div className="mt-6 space-y-4">

                {/* Error Message */}
                {error && (
                  <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm flex items-center gap-3 animate-shake">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-6 py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !selectedDate || !selectedTime}
                    className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all shadow-button hover:shadow-button-hover disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Booking...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Confirm Booking
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
        </div>
      </div>

      {/* Redirect Screen with Countdown */}
      {showRedirectScreen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] animate-fadeIn">
          <div className="bg-white rounded-3xl p-10 max-w-md w-full mx-4 text-center shadow-2xl animate-popIn">
            {/* Success Icon */}
            <div className="mb-8 relative">
              <div className="absolute inset-0 mx-auto w-24 h-24 bg-green-400/30 rounded-full animate-ping"></div>
              <div className="relative mx-auto w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Success Message */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              🎉 Booking Successful!
            </h3>
            <p className="text-gray-600 mb-8">
              Your appointment has been booked successfully.
            </p>

            {/* Countdown */}
            <div className="mb-8">
              <div className="relative inline-flex items-center justify-center w-20 h-20 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
                <svg className="absolute inset-0 w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="4"
                    strokeDasharray={`${((3 - countdown) / 3) * 226} 226`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{countdown}</span>
              </div>
              <p className="text-sm text-gray-600 font-medium">
                Redirecting to payment page...
              </p>
            </div>

            {/* Loading Bar */}
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-1000 ease-linear"
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
