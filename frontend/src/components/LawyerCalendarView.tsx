import React, { useState, useEffect, useRef } from 'react';
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

const LawyerCalendarView: React.FC<LawyerCalendarViewProps> = ({ onError, refreshTrigger }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'week' | 'day'>('week');
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    // Debounce API calls to prevent excessive requests
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(() => {
      fetchEvents();
    }, 300);

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [currentDate, view, refreshTrigger]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();

      // Fetch both database appointments and Google Calendar events in parallel
      const [dbResponse, googleResponse] = await Promise.allSettled([
        lawyerApi.getCalendarAppointments(startDate, endDate),
        lawyerApi.getGoogleCalendarEvents(startDate, endDate),
      ]);

      let allEvents: CalendarEvent[] = [];

      // Process database appointments
      if (dbResponse.status === 'fulfilled') {
        allEvents = [...dbResponse.value.events];
      } else {
        console.error('Failed to fetch database appointments:', dbResponse.reason);
      }

      // Process Google Calendar events - DISABLED for now to show only database events
      // if (googleResponse.status === 'fulfilled') {
      //   // Filter out consultation events from Google Calendar since we have them from database
      //   const googleEvents = googleResponse.value.events.filter((e: CalendarEvent) => {
      //     const summary = e.summary?.toLowerCase() || '';
      //     return !summary.includes('consultation');
      //   });
      //   allEvents = [...allEvents, ...googleEvents];
      // }

      setEvents(allEvents);
    } catch (err: any) {
      console.error('Failed to fetch events:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load calendar events';

      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
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
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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
    const colors: Record<string, string> = {
      '1': 'bg-blue-100 border-blue-400 text-blue-800',
      '2': 'bg-green-100 border-green-400 text-green-800',
      '3': 'bg-purple-100 border-purple-400 text-purple-800',
      '4': 'bg-red-100 border-red-400 text-red-800',
      '5': 'bg-yellow-100 border-yellow-400 text-yellow-800',
      '6': 'bg-orange-100 border-orange-400 text-orange-800',
      '7': 'bg-cyan-100 border-cyan-400 text-cyan-800',
      '8': 'bg-teal-100 border-teal-400 text-teal-800',
      '9': 'bg-indigo-100 border-indigo-400 text-indigo-800',
      '10': 'bg-emerald-100 border-emerald-400 text-emerald-800',
      '11': 'bg-rose-100 border-rose-400 text-rose-800',
    };

    const baseColor = event.color ? (colors[event.color] || 'bg-blue-100 border-blue-400 text-blue-800') : 'bg-blue-100 border-blue-400 text-blue-800';

    // Add opacity and styling for completed appointments
    if (event.status === 'completed') {
      return baseColor + ' opacity-60';
    }

    return baseColor;
  };

  const getEventTextStyle = (event: CalendarEvent): string => {
    // Add strikethrough for completed appointments
    return event.status === 'completed' ? 'line-through' : '';
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
                        {dayEvents.map(event => (
                          <div
                            key={event.id}
                            className={`text-xs p-1.5 mb-1 rounded border-l-2 ${getEventColor(event)}`}
                            title={event.description || ''}
                          >
                            <div className={`font-medium truncate ${getEventTextStyle(event)}`}>{event.summary}</div>
                            <div className={`text-[10px] opacity-75 ${getEventTextStyle(event)}`}>
                              {formatTime(event.start)} - {formatTime(event.end)}
                            </div>
                            {event.status === 'completed' && (
                              <div className="text-[10px] mt-0.5 font-medium text-green-700">✓ Completed</div>
                            )}
                          </div>
                        ))}
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
                    {hourEvents.map(event => (
                      <div
                        key={event.id}
                        className={`p-2 mb-2 rounded-md border-l-2 ${getEventColor(event)}`}
                      >
                        <div className={`text-sm font-medium ${getEventTextStyle(event)}`}>{event.summary}</div>
                        <div className={`text-xs mt-0.5 opacity-75 ${getEventTextStyle(event)}`}>
                          {formatTime(event.start)} - {formatTime(event.end)}
                        </div>
                        {event.status === 'completed' && (
                          <div className="text-xs mt-1 font-medium text-green-700">✓ Completed</div>
                        )}
                        {event.description && (
                          <div className="text-xs mt-1 text-gray-600">{event.description}</div>
                        )}
                      </div>
                    ))}
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
