import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../services/api';

interface CustomCalendarProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  minDate: string;
  maxDate: string;
  lawyerId?: number;
}

const CustomCalendar: React.FC<CustomCalendarProps> = ({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
  lawyerId,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [unavailableDates, setUnavailableDates] = useState<Set<string>>(new Set());
  const [loadingDates, setLoadingDates] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(new Date(selectedDate));
    }
  }, [selectedDate]);

  // Fetch unavailable dates IMMEDIATELY when lawyerId is provided or month changes
  useEffect(() => {
    if (lawyerId) {
      fetchUnavailableDates();
    }

    // Cleanup: cancel any pending requests when component unmounts or month changes
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [currentMonth, lawyerId]);

  // Auto-refresh unavailable dates every 10 seconds
  useEffect(() => {
    if (!lawyerId) return;

    const intervalId = setInterval(() => {
      fetchUnavailableDates();
    }, 10000); // 10 seconds

    return () => {
      clearInterval(intervalId);
      // Cancel any pending requests when interval is cleaned up
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [currentMonth, lawyerId]);

  const fetchUnavailableDates = async () => {
    if (!lawyerId) return;

    // Cancel any previous pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setLoadingDates(true);
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;

      const response = await api.get(`/lawyers/${lawyerId}/unavailable-dates`, {
        params: { year, month },
        signal: abortController.signal
      });

      // Only update state if request wasn't aborted
      if (!abortController.signal.aborted) {
        const unavailable = new Set<string>(
          response.data.map((item: { date: string }) => {
            // Ensure date is in YYYY-MM-DD format without time/timezone issues
            const dateStr = item.date.includes('T') ? item.date.split('T')[0] : item.date;
            return dateStr;
          })
        );

        setUnavailableDates(unavailable);
        setInitialLoadComplete(true);
      }
    } catch (err: any) {
      // Ignore abort errors (expected when component unmounts or requests are canceled)
      if (err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        return;
      }

      // Silently handle network errors - component might be unmounting or modal closing
      if (!abortController.signal.aborted && err?.code !== 'ERR_NETWORK') {
        console.error('Error fetching unavailable dates:', err);
      }
    } finally {
      // Only clear loading state if request wasn't aborted
      if (!abortController.signal.aborted) {
        setLoadingDates(false);
      }
    }
  };

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const isDateDisabled = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;

    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const min = new Date(minDate);
    const max = new Date(maxDate);

    // Check if date is out of range OR marked as unavailable
    if (date < min || date > max) {
      return true;
    }

    const isUnavailable = unavailableDates.has(dateString);
    return isUnavailable;
  };

  const isPastDate = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isWithin24Hours = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const min = new Date(minDate);

    // Within 24 hours means: date is today or tomorrow (but not past)
    return date >= today && date < min;
  };

  const isWeekend = (dayOfWeek: number) => {
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  };

  const isToday = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const selected = new Date(selectedDate);
    return date.toDateString() === selected.toDateString();
  };

  const handleDateClick = (day: number) => {
    if (isDateDisabled(day)) return;
    
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;
    
    onDateSelect(dateString);
  };

  const renderDays = () => {
    const days = [];
    const totalDays = daysInMonth(currentMonth);
    const firstDay = firstDayOfMonth(currentMonth);

    // Empty cells for days before the month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="p-2"></div>
      );
    }

    // Actual days
    for (let day = 1; day <= totalDays; day++) {
      const year = currentMonth.getFullYear();
      const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateString = `${year}-${month}-${dayStr}`;

      const dayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).getDay();
      const weekend = isWeekend(dayOfWeek);
      const today = isToday(day);
      const selected = isSelected(day);

      // Check different disable reasons
      const isUnavailableByLawyer = unavailableDates.has(dateString);
      const isPast = isPastDate(day);
      const isTooSoon = isWithin24Hours(day);
      const disabled = isDateDisabled(day) || isTooSoon || isPast;

      days.push(
        <button
          key={`${day}-${dateString}`}
          type="button"
          onClick={() => handleDateClick(day)}
          disabled={disabled}
          className={`
            w-full aspect-square flex items-center justify-center rounded-lg font-medium transition-all text-sm sm:text-base
            ${isPast && !isUnavailableByLawyer
              ? 'text-gray-300 cursor-not-allowed bg-gray-50'
              : ''
            }
            ${isPast && isUnavailableByLawyer
              ? 'text-gray-400 cursor-not-allowed bg-gray-100'
              : ''
            }
            ${isTooSoon && !isUnavailableByLawyer && !isPast
              ? 'text-orange-400 cursor-not-allowed bg-orange-50 border border-orange-200'
              : ''
            }
            ${isUnavailableByLawyer && !isTooSoon && !isPast
              ? 'text-gray-300 cursor-not-allowed bg-gray-50'
              : ''
            }
            ${isUnavailableByLawyer && isTooSoon && !isPast
              ? 'text-gray-400 cursor-not-allowed bg-gray-100 border border-gray-300'
              : ''
            }
            ${!disabled && !isUnavailableByLawyer && !isTooSoon && !isPast
              ? 'hover:bg-blue-50 cursor-pointer'
              : ''
            }
            ${weekend && !disabled && !isUnavailableByLawyer && !isPast ? 'text-red-500' : ''}
            ${selected
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg scale-110'
              : ''
            }
            ${today && !selected
              ? 'border-2 border-blue-400'
              : ''
            }
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const canGoPrevious = () => {
    const firstOfCurrentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const min = new Date(minDate);
    return firstOfCurrentMonth > min;
  };

  const canGoNext = () => {
    const lastOfCurrentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const max = new Date(maxDate);
    return lastOfCurrentMonth < max;
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm relative">
      {/* Loading overlay for initial load */}
      {loadingDates && !initialLoadComplete && (
        <div className="absolute inset-0 bg-white bg-opacity-75 rounded-xl flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Loading availability...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={previousMonth}
          disabled={!canGoPrevious()}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h3 className="text-lg font-bold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        
        <button
          type="button"
          onClick={nextMonth}
          disabled={!canGoNext()}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day, index) => (
          <div
            key={day}
            className={`text-center text-xs font-semibold py-2 ${
              index === 0 || index === 6 ? 'text-red-500' : 'text-gray-600'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {useMemo(() => renderDays(), [currentMonth, selectedDate, unavailableDates, minDate, maxDate])}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center flex-wrap gap-3 mt-4 pt-4 border-t text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 border-2 border-blue-400 rounded"></div>
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-600 rounded"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-50 border border-orange-200 rounded"></div>
          <span>Book 1 day before</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-50 rounded"></div>
          <span>Unavailable</span>
        </div>
      </div>
    </div>
  );
};

export default CustomCalendar;