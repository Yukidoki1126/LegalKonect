import React, { useState, useEffect, useRef, useCallback } from 'react';
import { lawyerApi } from '../services/lawyerApi';

interface CalendarEvent {
  id: string;
  summary: string;
  description: string;
  start: string;
  end: string;
  color: string | null;
  is_all_day: boolean;
  status?: string;
  payment_status?: string;
}

interface LawyerCalendarViewProps {
  onError?: (error: string) => void;
  refreshTrigger?: number;
}

// Cache for calendar events - persists between renders
const eventCache = new Map<string, { events: CalendarEvent[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

const LawyerCalendarView: React.FC<LawyerCalendarViewProps> = ({ onError, refreshTrigger }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'week' | 'day'>('week');
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshTrigger = useRef(refreshTrigger);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDateRange = useCallback(() => {
    if (view === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      return {
        startDate: formatDate(startOfWeek),
        endDate: formatDate(endOfWeek),
      };
    } else {
      return {
        startDate: formatDate(currentDate),
        endDate: formatDate(currentDate),
      };
    }
  }, [currentDate, view]);

  const getCacheKey = useCallback(() => {
    const { startDate, endDate } = getDateRange();
    return `${startDate}_${endDate}_${view}`;
  }, [getDateRange, view]);

  const fetchEvents = useCallback(async (forceRefresh = false) => {
    const cacheKey = getCacheKey();
    const cached = eventCache.get(cacheKey);
    const now = Date.now();

    // Use cache if valid and not forcing refresh
    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
      setEvents(cached.events);
      return;
    }

    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();

      // Fetch both database appointments and Google Calendar events in parallel
      const [dbResponse] = await Promise.allSettled([
        lawyerApi.getCalendarAppointments(startDate, endDate),
      ]);

      let allEvents: CalendarEvent[] = [];

      // Process database appointments
      if (dbResponse.status === 'fulfilled') {
        allEvents = [...dbResponse.value.events];
      } else {
        console.error('Failed to fetch database appointments:', dbResponse.reason);
      }

      // Store in cache
      eventCache.set(cacheKey, { events: allEvents, timestamp: now });
      setEvents(allEvents);

      // Pre-fetch adjacent weeks/days for smoother navigation
      prefetchAdjacentData();
    } catch (err: any) {
      console.error('Failed to fetch events:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load calendar events';

      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [getCacheKey, getDateRange, onError]);

  // Pre-fetch adjacent weeks/days in the background
  const prefetchAdjacentData = useCallback(async () => {
    const prefetchDates: { start: Date; end: Date }[] = [];

    if (view === 'week') {
      // Prefetch previous and next week
      const prevWeekStart = new Date(currentDate);
      prevWeekStart.setDate(currentDate.getDate() - currentDate.getDay() - 7);
      const prevWeekEnd = new Date(prevWeekStart);
      prevWeekEnd.setDate(prevWeekStart.getDate() + 6);

      const nextWeekStart = new Date(currentDate);
      nextWeekStart.setDate(currentDate.getDate() - currentDate.getDay() + 7);
      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

      prefetchDates.push(
        { start: prevWeekStart, end: prevWeekEnd },
        { start: nextWeekStart, end: nextWeekEnd }
      );
    } else {
      // Prefetch previous and next day
      const prevDay = new Date(currentDate);
      prevDay.setDate(currentDate.getDate() - 1);

      const nextDay = new Date(currentDate);
      nextDay.setDate(currentDate.getDate() + 1);

      prefetchDates.push(
        { start: prevDay, end: prevDay },
        { start: nextDay, end: nextDay }
      );
    }

    // Prefetch in background without blocking UI
    for (const { start, end } of prefetchDates) {
      const cacheKey = `${formatDate(start)}_${formatDate(end)}_${view}`;
      if (!eventCache.has(cacheKey)) {
        try {
          const response = await lawyerApi.getCalendarAppointments(formatDate(start), formatDate(end));
          eventCache.set(cacheKey, { events: response.events, timestamp: Date.now() });
        } catch (err) {
          // Silently ignore prefetch errors
        }
      }
    }
  }, [currentDate, view]);

  useEffect(() => {
    // Check if this is a refresh trigger change (force refresh)
    const isForceRefresh = refreshTrigger !== lastRefreshTrigger.current;
    lastRefreshTrigger.current = refreshTrigger;

    if (isForceRefresh) {
      // Clear ALL cache on force refresh to ensure fresh data
      eventCache.clear();
      console.log('[LawyerCalendarView] Cache cleared due to refresh trigger');
    }

    // Debounce API calls to prevent excessive requests
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Check cache first for instant display (only if not force refreshing)
    if (!isForceRefresh) {
      const cacheKey = getCacheKey();
      const cached = eventCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        setEvents(cached.events);
        setLoading(false);
        return;
      }
    }

    // Fetch fresh data
    fetchTimeoutRef.current = setTimeout(() => {
      fetchEvents(isForceRefresh);
    }, 100); // Reduced debounce for faster response

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [currentDate, view, refreshTrigger, fetchEvents, getCacheKey]);

  const getWeekDays = (): Date[] => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  };

  const getEventsForTimeSlot = (date: Date, hour: number): CalendarEvent[] => {
    const dateStr = formatDate(date);
    const filteredEvents = events.filter(event => {
      if (event.is_all_day) return false;

      const eventStart = new Date(event.start);
      const eventDate = event.start.split('T')[0];
      const eventHour = eventStart.getHours();

      return eventDate === dateStr && eventHour === hour;
    });

    return filteredEvents;
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'week') {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      newDate.setDate(currentDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'week') {
      newDate.setDate(currentDate.getDate() + 7);
    } else {
      newDate.setDate(currentDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventColor = (event: CalendarEvent): string => {
    // Cancelled appointments - show in red
    if (event.status === 'cancelled') {
      return 'bg-red-100 border-red-500 text-red-800 opacity-70';
    }

    // Completed appointments - show with reduced opacity
    if (event.status === 'completed') {
      return 'bg-gray-100 border-gray-400 text-gray-600 opacity-60';
    }

    // Pending payment - show in yellow/amber
    if (event.payment_status === 'unpaid' || event.payment_status === 'pending') {
      return 'bg-amber-100 border-amber-400 text-amber-800';
    }

    // Default - confirmed/paid appointments in green
    return 'bg-green-100 border-green-400 text-green-800';
  };

  const getEventTextStyle = (event: CalendarEvent): string => {
    // Add strikethrough for cancelled or completed appointments
    if (event.status === 'cancelled') return 'line-through';
    if (event.status === 'completed') return 'line-through opacity-70';
    return '';
  };

  const getStatusBadge = (event: CalendarEvent): string | null => {
    if (event.status === 'cancelled') return '✗ Cancelled';
    if (event.status === 'completed') return '✓ Completed';
    if (event.payment_status === 'unpaid') return '⏳ Unpaid';
    return null;
  };

  const weekDays = getWeekDays();
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Calendar Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-medium text-gray-900">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={navigatePrevious}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={navigateNext}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setView('week')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              view === 'week'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setView('day')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              view === 'day'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Day
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-900"></div>
        </div>
      ) : view === 'week' ? (
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Week Header */}
            <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50">
              <div className="p-2 text-xs font-medium text-gray-500 border-r border-gray-200">Time</div>
              {weekDays.map((date, index) => (
                <div
                  key={index}
                  className={`p-2 text-center border-r border-gray-200 ${
                    formatDate(date) === formatDate(new Date()) ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="text-xs font-medium text-gray-500">{days[date.getDay()].slice(0, 3)}</div>
                  <div className={`text-sm font-semibold ${
                    formatDate(date) === formatDate(new Date()) ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {date.getDate()}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Slots */}
            <div className="divide-y divide-gray-200">
              {hours.map(hour => (
                <div key={hour} className="grid grid-cols-8 hover:bg-gray-50/50 transition-colors">
                  <div className="p-2 text-xs text-gray-500 font-medium border-r border-gray-200 bg-gray-50/50">
                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                  </div>
                  {weekDays.map((date, dayIndex) => {
                    const dayEvents = getEventsForTimeSlot(date, hour);
                    return (
                      <div
                        key={dayIndex}
                        className={`p-1 min-h-[50px] border-r border-gray-200 ${
                          formatDate(date) === formatDate(new Date()) ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        {dayEvents.map(event => {
                          const statusBadge = getStatusBadge(event);
                          return (
                            <div
                              key={event.id}
                              className={`text-xs p-1.5 mb-1 rounded border-l-2 ${getEventColor(event)}`}
                              title={event.description || ''}
                            >
                              <div className={`font-medium truncate ${getEventTextStyle(event)}`}>{event.summary}</div>
                              <div className={`text-[10px] opacity-75 ${getEventTextStyle(event)}`}>
                                {formatTime(event.start)} - {formatTime(event.end)}
                              </div>
                              {statusBadge && (
                                <div className={`text-[10px] mt-0.5 font-medium ${
                                  event.status === 'cancelled' ? 'text-red-700' : 
                                  event.status === 'completed' ? 'text-gray-600' : 'text-amber-700'
                                }`}>{statusBadge}</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Day View */
        <div className="p-4">
          <div className="text-center mb-4 py-2 bg-gray-50 rounded-md border border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">
              {days[currentDate.getDay()]}, {months[currentDate.getMonth()]} {currentDate.getDate()}, {currentDate.getFullYear()}
            </h3>
          </div>
          <div className="space-y-1">
            {hours.map(hour => {
              const hourEvents = getEventsForTimeSlot(currentDate, hour);
              return (
                <div key={hour} className="flex gap-4 border-b border-gray-100 pb-2 hover:bg-gray-50/50 transition-colors">
                  <div className="w-16 text-xs text-gray-500 font-medium pt-1">
                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                  </div>
                  <div className="flex-1 min-h-[40px]">
                    {hourEvents.map(event => {
                      const statusBadge = getStatusBadge(event);
                      return (
                        <div
                          key={event.id}
                          className={`p-2 mb-2 rounded-md border-l-2 ${getEventColor(event)}`}
                        >
                          <div className={`text-sm font-medium ${getEventTextStyle(event)}`}>{event.summary}</div>
                          <div className={`text-xs mt-0.5 opacity-75 ${getEventTextStyle(event)}`}>
                            {formatTime(event.start)} - {formatTime(event.end)}
                          </div>
                          {statusBadge && (
                            <div className={`text-xs mt-1 font-medium ${
                              event.status === 'cancelled' ? 'text-red-700' : 
                              event.status === 'completed' ? 'text-gray-600' : 'text-amber-700'
                            }`}>{statusBadge}</div>
                          )}
                          {event.description && (
                            <div className="text-xs mt-1 text-gray-600">{event.description}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All-day events section */}
      {events.some(e => e.is_all_day) && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs font-medium text-gray-500 mb-2">All-day events</div>
          <div className="space-y-1">
            {events.filter(e => e.is_all_day).map(event => (
              <div
                key={event.id}
                className={`p-2 rounded-md border-l-2 ${getEventColor(event)}`}
              >
                <div className={`text-sm font-medium ${getEventTextStyle(event)}`}>{event.summary}</div>
                {event.status === 'completed' && (
                  <div className="text-xs mt-0.5 font-medium text-green-700">✓ Completed</div>
                )}
                {event.description && (
                  <div className="text-xs mt-1 text-gray-600">{event.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LawyerCalendarView;
