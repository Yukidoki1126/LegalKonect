import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LawyerCalendarView from '../../components/LawyerCalendarView';

interface CalendarStatus {
  connected: boolean;
  calendar_id: string | null;
  connected_at: string | null;
}

interface Schedule {
  id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const LawyerGoogleCalendar: React.FC = () => {
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [calendarRefreshTrigger, setCalendarRefreshTrigger] = useState(0);

  // Schedule form state
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    day_of_week: 'Monday',
    start_time: '09:00',
    end_time: '17:00',
  });

  useEffect(() => {
    fetchStatus();
    fetchSchedules();

    // Check for OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    const successParam = urlParams.get('success');
    const errorParam = urlParams.get('error');

    if (successParam === 'true') {
      setSuccess('Google Calendar connected successfully!');
      window.history.replaceState({}, '', '/lawyer/calendar');
      fetchStatus();
    } else if (errorParam) {
      setError(`Failed to connect Google Calendar: ${errorParam}`);
      window.history.replaceState({}, '', '/lawyer/calendar');
    }
  }, []);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/lawyer/google/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus(response.data);
    } catch (err: any) {
      console.error('Failed to fetch calendar status:', err);
      setError('Failed to load calendar status');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      setSchedulesLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/lawyer/schedules', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchedules(response.data);
    } catch (err: any) {
      console.error('Failed to fetch schedules:', err);
    } finally {
      setSchedulesLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setActionLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/lawyer/google/auth-url', {
        headers: { Authorization: `Bearer ${token}` }
      });

      window.location.href = response.data.auth_url;
    } catch (err: any) {
      console.error('Failed to get auth URL:', err);
      setError('Failed to initiate Google Calendar connection');
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect your Google Calendar? Your appointments will no longer sync automatically.')) {
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/api/lawyer/google/disconnect', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Google Calendar disconnected successfully');
      fetchStatus();
    } catch (err: any) {
      console.error('Failed to disconnect:', err);
      setError('Failed to disconnect Google Calendar');
    } finally {
      setActionLoading(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');

      if (editingSchedule) {
        await axios.put(
          `http://localhost:8000/api/lawyer/schedules/${editingSchedule.id}`,
          scheduleForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuccess('Schedule updated successfully');
      } else {
        await axios.post(
          'http://localhost:8000/api/lawyer/schedules',
          scheduleForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuccess('Schedule created successfully');
      }

      fetchSchedules();
      setShowScheduleForm(false);
      setEditingSchedule(null);
      setScheduleForm({ day_of_week: 'Monday', start_time: '09:00', end_time: '17:00' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save schedule');
    }
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
    });
    setShowScheduleForm(true);
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/lawyer/schedules/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Schedule deleted successfully');
      fetchSchedules();
    } catch (err: any) {
      setError('Failed to delete schedule');
    }
  };

  const handleToggleSchedule = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:8000/api/lawyer/schedules/${id}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchSchedules();
    } catch (err: any) {
      setError('Failed to toggle schedule');
    }
  };

  const handleSyncToCalendar = async () => {
    if (!status?.connected) {
      setError('Please connect Google Calendar first');
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:8000/api/lawyer/google/sync-schedules',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Schedules synced to Google Calendar successfully! Check your calendar in the next 4 weeks.');

      // Trigger calendar refresh to show newly synced events
      setCalendarRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to sync schedules to Google Calendar');
    } finally {
      setActionLoading(false);
    }
  };


  const groupSchedulesByDay = () => {
    const grouped: Record<string, Schedule[]> = {};
    DAYS_OF_WEEK.forEach(day => {
      grouped[day] = schedules.filter(s => s.day_of_week === day);
    });
    return grouped;
  };

  const formatTime = (time: string): string => {
    // Extract HH:MM from time string (handles both "HH:MM" and "HH:MM:SS.mmmmm" formats)
    if (time.includes(':')) {
      const parts = time.split(':');
      return `${parts[0]}:${parts[1]}`;
    }
    return time;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const groupedSchedules = groupSchedulesByDay();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Google Calendar Integration</h1>
          <p className="text-lg text-gray-600">
            Sync your appointments with Google Calendar and manage your availability
          </p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-r-lg shadow-sm">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-8 bg-green-50 border-l-4 border-green-500 text-green-700 px-6 py-4 rounded-r-lg shadow-sm">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{success}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Column - Connection Status & Schedule Management */}
        <div className="xl:col-span-4 space-y-8">
          {/* Connection Status Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-10 h-10" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3z"/>
                    <path fill="#fff" d="M16.5 10.5h-9v3h9v-3z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold">Google Calendar</h2>
                  <p className="text-blue-100 text-sm mt-1">
                    {status?.connected ? 'Connected & Synced' : 'Not Connected'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8">
              {status?.connected ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-900">Active Connection</p>
                      <p className="text-xs text-green-700 mt-0.5">Your calendar is synced</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    disabled={actionLoading}
                    className="w-full px-5 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:bg-gray-400 transition-all hover:shadow-md"
                  >
                    {actionLoading ? 'Disconnecting...' : 'Disconnect Calendar'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Connect your Google Calendar to automatically sync appointments and manage your availability.
                  </p>
                  <button
                    onClick={handleConnect}
                    disabled={actionLoading}
                    className="w-full px-5 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-all hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3z"/>
                    </svg>
                    {actionLoading ? 'Connecting...' : 'Connect Google Calendar'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Weekly Schedule Management */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Weekly Schedule</h3>
                <p className="text-sm text-gray-600 mt-1">Set your consultation hours</p>
              </div>
              <button
                onClick={() => {
                  setShowScheduleForm(true);
                  setEditingSchedule(null);
                  setScheduleForm({ day_of_week: 'Monday', start_time: '09:00', end_time: '17:00' });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </button>
            </div>

            <div className="p-6">
              {schedulesLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : schedules.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-600 font-medium">No schedules set</p>
                  <p className="text-gray-500 text-sm mt-1">Add your availability hours to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {DAYS_OF_WEEK.map(day => {
                    const daySchedules = groupedSchedules[day];
                    if (daySchedules.length === 0) return null;

                    return (
                      <div key={day} className="border border-gray-200 rounded-xl p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">{day}</div>
                        <div className="space-y-3">
                          {daySchedules.map(schedule => (
                            <div
                              key={schedule.id}
                              className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
                            >
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleToggleSchedule(schedule.id)}
                                  className={`w-5 h-5 rounded border-2 transition-all ${
                                    schedule.is_active
                                      ? 'bg-green-500 border-green-500'
                                      : 'bg-white border-gray-300 hover:border-gray-400'
                                  }`}
                                >
                                  {schedule.is_active && (
                                    <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                                    </svg>
                                  )}
                                </button>
                                <span className={`text-sm font-medium ${schedule.is_active ? 'text-gray-900' : 'text-gray-400'}`}>
                                  {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditSchedule(schedule)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteSchedule(schedule.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sync Button */}
              {schedules.length > 0 && status?.connected && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleSyncToCalendar}
                    disabled={actionLoading}
                    className="w-full px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 transition-all hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {actionLoading ? 'Syncing...' : 'Sync Schedules to Calendar'}
                  </button>
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-900 font-medium text-center">
                      📅 Creates availability blocks for the next 4 weeks
                    </p>
                  </div>
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-green-900 font-medium text-center">
                      ✅ Appointments sync automatically when created or confirmed
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Calendar */}
        <div className="xl:col-span-8">
          {status?.connected && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
              <div className="p-8 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Your Calendar</h2>
                    <p className="text-gray-600 mt-1">
                      View and manage your appointments
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="p-8">
                <LawyerCalendarView
                  onError={(err) => setError(err)}
                  refreshTrigger={calendarRefreshTrigger}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Form Modal */}
      {showScheduleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all">
            <div className="p-8 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {editingSchedule ? 'Edit Schedule' : 'Add Schedule'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-0.5">Set your consultation hours</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleScheduleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Day of Week
                </label>
                <select
                  value={scheduleForm.day_of_week}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, day_of_week: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                >
                  {DAYS_OF_WEEK.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.start_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.end_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowScheduleForm(false);
                    setEditingSchedule(null);
                  }}
                  className="flex-1 px-5 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={schedulesLoading}
                  className="flex-1 px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-all hover:shadow-lg"
                >
                  {schedulesLoading ? 'Saving...' : editingSchedule ? 'Update Schedule' : 'Add Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8 shadow-sm">
        <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          How It Works
        </h3>
        <div className="text-blue-800 space-y-3">
          <p className="text-sm leading-relaxed">
            <strong className="font-semibold">1. Set Your Schedule:</strong> Add your weekly consultation hours for each day you're available.
          </p>
          <p className="text-sm leading-relaxed">
            <strong className="font-semibold">2. Sync to Google Calendar:</strong> Click the sync button to create availability blocks in your Google Calendar for the next 4 weeks.
          </p>
          <p className="text-sm leading-relaxed">
            <strong className="font-semibold">3. View Your Calendar:</strong> All your appointments and availability blocks appear in the calendar view above.
          </p>
        </div>
      </div>
    </div>
  </div>
  );
};

export default LawyerGoogleCalendar;
