import React, { useEffect, useState } from 'react';
import { lawyerApi } from '../../services/lawyerApi';

interface DateAvailability {
  date: string;
  is_available: boolean;
}

const LawyerCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [unavailableDates, setUnavailableDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAvailability();
  }, [currentDate]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const data: DateAvailability[] = await lawyerApi.getCalendarAvailability(year, month);

      const unavailable = new Set<string>(
        data
          .filter((d) => !d.is_available)
          .map((d) => d.date)
      );
      setUnavailableDates(unavailable);
    } catch (err) {
      console.error('Error fetching availability:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDateAvailability = async (dateStr: string) => {
    const isCurrentlyUnavailable = unavailableDates.has(dateStr);

    try {
      setSaving(true);
      await lawyerApi.setDateAvailability(dateStr, isCurrentlyUnavailable);

      // Update local state
      setUnavailableDates((prev) => {
        const newUnavailable = new Set(prev);
        if (isCurrentlyUnavailable) {
          newUnavailable.delete(dateStr);
        } else {
          newUnavailable.add(dateStr);
        }
        return newUnavailable;
      });
    } catch (err) {
      console.error('Error updating availability:', err);
      alert('Failed to update availability');
    } finally {
      setSaving(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const formatDateString = (day: number) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const isDateUnavailable = (day: number) => {
    return unavailableDates.has(formatDateString(day));
  };

  const isPastDate = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    // Calculate tomorrow (24 hours from now rule)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    // Dates before tomorrow are not bookable
    return date < tomorrow;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = getDaysInMonth(currentDate);

  return (
    <div className="max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Calendar & Availability</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your available dates for consultations</p>
      </div>

      {/* Legend */}
      <div className="mb-6 flex flex-wrap gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 border-2 border-green-500 rounded"></div>
          <span className="text-sm text-gray-700">Available (ON)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-100 border-2 border-red-500 rounded"></div>
          <span className="text-sm text-gray-700">Unavailable (OFF)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-50 border-2 border-orange-200 rounded"></div>
          <span className="text-sm text-gray-700">Book 1 day before</span>
        </div>
      </div>

      {/* Calendar Card */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Calendar Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h2 className="text-2xl font-bold text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>

          <button
            onClick={nextMonth}
            className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Calendar Body */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Day Names */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {dayNames.map((name) => (
                  <div key={name} className="text-center font-semibold text-gray-600 text-sm py-2">
                    {name}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="aspect-square"></div>;
                  }

                  const isPast = isPastDate(day);
                  const isUnavailable = isDateUnavailable(day);

                  return (
                    <button
                      key={day}
                      onClick={() => !isPast && !saving && toggleDateAvailability(formatDateString(day))}
                      disabled={isPast || saving}
                      className={`
                        aspect-square p-2 rounded-lg font-medium transition-all
                        ${isPast
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-300'
                          : isUnavailable
                          ? 'bg-red-100 text-red-700 border-2 border-red-500 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 border-2 border-green-500 hover:bg-green-200'
                        }
                        ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <div className="flex flex-col items-center justify-center h-full">
                        <span className="text-lg">{day}</span>
                        {!isPast && (
                          <span className="text-xs mt-1">
                            {isUnavailable ? 'OFF' : 'ON'}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold text-yellow-900 mb-1">How to use:</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Click on any future date to toggle between available/unavailable</li>
              <li>• Green dates are available for client bookings</li>
              <li>• Red dates are blocked and won't accept bookings</li>
              <li>• Gray dates cannot be modified (appointments must be booked 24+ hours in advance)</li>
              <li>• Use the arrows to navigate between months</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LawyerCalendar;
