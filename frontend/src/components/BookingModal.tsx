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
  const [success, setSuccess] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

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

      setSuccess(true);
      setTimeout(() => {
        onClose();
        window.location.href = '/appointments';
      }, 2000);
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
    setSuccess(false);
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
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Appointment Booked Successfully!
              </h3>
              <p className="text-gray-600">
                Redirecting to your appointments...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT COLUMN */}
                <div className="space-y-5">
                  {/* Date Selection with Custom Calendar */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Date
                    </label>
                    <CustomCalendar
                      selectedDate={selectedDate}
                      onDateSelect={setSelectedDate}
                      minDate={getMinDate()}
                      maxDate={getMaxDate()}
                      lawyerId={lawyer.id}
                    />
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Appointments must be booked at least 24 hours in advance
                    </p>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-5">
                  {/* Time Slots */}
                  {selectedDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Time Slot
                      </label>
                      {loadingSlots ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="text-gray-600 mt-2 text-sm">Loading available slots...</p>
                        </div>
                      ) : availableSlots.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot.time}
                              type="button"
                              onClick={() => setSelectedTime(slot.time)}
                              className={`px-3 py-2 rounded-lg border-2 text-xs font-semibold transition-all ${
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
                          <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-gray-600 font-medium text-sm">No available slots</p>
                          <p className="text-gray-500 text-xs mt-1">Please select a different date</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Meeting Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meeting Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'in-person', icon: '🏢', label: 'In-Person' },
                        { value: 'video', icon: '💻', label: 'Video Call' },
                        { value: 'phone', icon: '📞', label: 'Phone' }
                      ].map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setMeetingType(type.value)}
                          className={`px-3 py-2 rounded-lg border-2 text-xs font-semibold transition-all flex flex-col items-center gap-1 ${
                            meetingType === type.value
                              ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                              : 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50 text-gray-700'
                          }`}
                        >
                          <span className="text-xl">{type.icon}</span>
                          <span>{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Consultation (Optional)
                    </label>
                    <textarea
                      value={clientNotes}
                      onChange={(e) => setClientNotes(e.target.value)}
                      rows={3}
                      placeholder="Brief description of your legal matter..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      maxLength={1000}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {clientNotes.length}/1000 characters
                    </p>
                  </div>
                </div>
              </div>

              {/* Price Summary and Actions - Full Width */}
              <div className="mt-5 space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-100">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium text-sm">Consultation Fee (1 hour)</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ₱{lawyer.hourly_rate.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 flex items-center gap-1 mt-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Payment will be processed after lawyer confirms the appointment
                  </p>
                </div>

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
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;