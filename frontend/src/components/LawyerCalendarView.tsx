import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface CalendarEvent {
  id: string;
  summary: string;
  description: string;
  start: string;
  end: string;
  color: string | null;
  is_all_day: boolean;
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

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    fetchEvents();
  }, [currentDate, view, refreshTrigger]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const { startDate, endDate } = getDateRange();

      const response = await axios.get('http://localhost:8000/api/lawyer/google/events', {
        params: {
          start_date: startDate,
          end_date: endDate,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('📅 Calendar Events Fetched:', response.data.events);
      console.log('📅 Total Events:', response.data.events.length);

      // Log consultation appointments separately
      const consultationEvents = response.data.events.filter((e: CalendarEvent) =>
        e.summary.startsWith('Consultation -')
      );
      console.log('👤 Consultation Appointments:', consultationEvents);

      setEvents(response.data.events);
    } catch (err: any) {
      console.error('Failed to fetch events:', err);
      if (onError) {
        onError('Failed to load calendar events');
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

      const matches = eventDate === dateStr && eventHour === hour;

      // Debug log for ALL events to catch timezone issues
      if (event.summary.startsWith('Consultation -')) {
        console.log(`🔍 Consultation Event Debug:`, {
          summary: event.summary,
          rawStart: event.start,
          parsedDate: eventStart,
          extractedDate: eventDate,
          extractedHour: eventHour,
          slotDate: dateStr,
          slotHour: hour,
          matches: matches
        });
      }

      return matches;
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
      '8': 'bg-gray-100 border-gray-400 text-gray-800',
      '9': 'bg-indigo-100 border-indigo-400 text-indigo-800',
      '10': 'bg-emerald-100 border-emerald-400 text-emerald-800',
      '11': 'bg-rose-100 border-rose-400 text-rose-800',
    };

    return event.color ? (colors[event.color] || 'bg-blue-100 border-blue-400 text-blue-800') : 'bg-blue-100 border-blue-400 text-blue-800';
  };

  const weekDays = getWeekDays();
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);

  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm font-semibold text-blue-600 bg-white border-2 border-blue-600 rounded-xl hover:bg-blue-50 transition-colors"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={navigatePrevious}
              className="p-3 text-gray-700 bg-white hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={navigateNext}
              className="p-3 text-gray-700 bg-white hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setView('week')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
              view === 'week'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Week View
          </button>
          <button
            onClick={() => setView('day')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
              view === 'day'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Day View
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : view === 'week' ? (
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-8 border-b border-gray-200">
              <div className="p-2 text-xs font-medium text-gray-500 border-r border-gray-200">Time</div>
              {weekDays.map((date, index) => (
                <div
                  key={index}
                  className={`p-2 text-center border-r border-gray-200 ${
                    formatDate(date) === formatDate(new Date()) ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="text-xs font-medium text-gray-500">{days[date.getDay()]}</div>
                  <div className={`text-lg font-bold ${
                    formatDate(date) === formatDate(new Date()) ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {date.getDate()}
                  </div>
                </div>
              ))}
            </div>

            <div className="divide-y divide-gray-200">
              {hours.map(hour => (
                <div key={hour} className="grid grid-cols-8">
                  <div className="p-2 text-xs text-gray-500 border-r border-gray-200">
                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                  </div>
                  {weekDays.map((date, dayIndex) => {
                    const dayEvents = getEventsForTimeSlot(date, hour);
                    return (
                      <div
                        key={dayIndex}
                        className={`p-1 min-h-[60px] border-r border-gray-200 ${
                          formatDate(date) === formatDate(new Date()) ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        {dayEvents.map(event => (
                          <div
                            key={event.id}
                            className={`text-xs p-1 mb-1 rounded border-l-2 ${getEventColor(event)}`}
                            title={event.description || ''}
                          >
                            <div className="font-medium truncate">{event.summary}</div>
                            <div className="text-xs opacity-75">
                              {formatTime(event.start)} - {formatTime(event.end)}
                            </div>
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
        <div className="p-4">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              {days[currentDate.getDay()]}, {months[currentDate.getMonth()]} {currentDate.getDate()}, {currentDate.getFullYear()}
            </h3>
          </div>
          <div className="space-y-1">
            {hours.map(hour => {
              const hourEvents = getEventsForTimeSlot(currentDate, hour);
              return (
                <div key={hour} className="flex gap-4 border-b border-gray-200 pb-2">
                  <div className="w-20 text-sm text-gray-500 pt-1">
                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                  </div>
                  <div className="flex-1 min-h-[40px]">
                    {hourEvents.map(event => (
                      <div
                        key={event.id}
                        className={`p-2 mb-2 rounded border-l-4 ${getEventColor(event)}`}
                      >
                        <div className="font-medium">{event.summary}</div>
                        <div className="text-xs mt-1">
                          {formatTime(event.start)} - {formatTime(event.end)}
                        </div>
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

      {events.some(e => e.is_all_day) && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm font-medium text-gray-700 mb-2">All-day events</div>
          <div className="space-y-1">
            {events.filter(e => e.is_all_day).map(event => (
              <div
                key={event.id}
                className={`p-2 rounded border-l-4 ${getEventColor(event)}`}
              >
                <div className="font-medium text-sm">{event.summary}</div>
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
