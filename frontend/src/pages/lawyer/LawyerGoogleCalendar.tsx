import React, { useState, useEffect } from 'react';
import { lawyerApi } from '../../services/lawyerApi';
import LawyerCalendarView from '../../components/LawyerCalendarView';
import { notificationService } from '../../services/notificationService';

interface CalendarStatus {
  connected: boolean;
  calendar_id: string | null;
  connected_at: string | null;
}

const LawyerGoogleCalendar: React.FC = () => {
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [calendarRefreshTrigger, setCalendarRefreshTrigger] = useState(0);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    fetchStatus(false).finally(() => {
      setLoading(false);
    });

    // Check for OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    const successParam = urlParams.get('success');
    const errorParam = urlParams.get('error');

    if (successParam === 'true') {
      setSuccess('Google Calendar connected successfully!');
      window.history.replaceState({}, '', '/lawyer/calendar');
      fetchStatus(false);
    } else if (errorParam) {
      setError(`Failed to connect Google Calendar: ${errorParam}`);
      window.history.replaceState({}, '', '/lawyer/calendar');
    }
  }, []);

  // Subscribe to notifications for real-time calendar updates
  useEffect(() => {
    const unsubscribe = notificationService.onNewNotification((notification) => {
      // Refresh calendar when appointment-related notifications arrive
      if (['appointment_created', 'appointment_cancelled', 'reschedule_accepted', 'reschedule_declined', 'payment_received'].includes(notification.type)) {
        console.log('[LawyerGoogleCalendar] Refreshing calendar due to:', notification.type);
        setCalendarRefreshTrigger(prev => prev + 1);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchStatus = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const data = await lawyerApi.getGoogleCalendarStatus();
      setStatus(data);
    } catch (err: any) {
      console.error('Failed to fetch calendar status:', err);
      setError('Failed to load calendar status');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setActionLoading(true);
      setError('');
      setShowConnectModal(false);

      const response = await lawyerApi.getGoogleAuthUrl();
      window.location.href = response.auth_url;
    } catch (err: any) {
      console.error('Failed to get auth URL:', err);
      setError('Failed to initiate Google Calendar connection');
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setActionLoading(true);
      setError('');
      setSuccess('');
      setShowDisconnectModal(false);

      await lawyerApi.disconnectGoogleCalendar();
      setSuccess('Google Calendar disconnected successfully');
      fetchStatus(false);
    } catch (err: any) {
      console.error('Failed to disconnect:', err);
      setError('Failed to disconnect Google Calendar');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError('');
      setSyncMessage('');

      const response = await lawyerApi.syncAppointmentsToGoogleCalendar();

      if (response.synced > 0) {
        setSuccess(`Successfully synced ${response.synced} appointment(s) to Google Calendar!`);
        setSyncMessage(`${response.synced} synced, ${response.failed} failed out of ${response.total} total`);
      } else {
        setSyncMessage('All appointments are already synced');
      }

      // Refresh calendar
      setCalendarRefreshTrigger(prev => prev + 1);

      setTimeout(() => {
        setSuccess('');
        setSyncMessage('');
      }, 5000);
    } catch (err: any) {
      console.error('Failed to sync:', err);
      setError(err.response?.data?.message || 'Failed to sync appointments');
    } finally {
      setSyncing(false);
    }
  };


  // Show skeleton if loading OR if data hasn't loaded yet
  if (loading || !status) {
    return (
      <div className="max-w-full overflow-x-hidden animate-fadeIn">
        {/* Header Skeleton - matching actual design */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="h-8 bg-gray-200 rounded-lg w-28 animate-pulse"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-72 ml-14 animate-pulse"></div>
        </div>

        {/* Connection Status Card Skeleton */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 mb-6 animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-200 rounded-xl"></div>
              <div>
                <div className="h-5 bg-gray-200 rounded w-44 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-64"></div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-11 bg-gray-200 rounded-xl w-40"></div>
            </div>
          </div>
        </div>

        {/* Main Calendar Card Skeleton */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden animate-pulse">
          {/* Card Header */}
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gray-200 rounded-lg w-8 h-8"></div>
                <div className="h-5 bg-gray-200 rounded w-36"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-9 bg-gray-200 rounded-xl w-28"></div>
                <div className="h-9 bg-gray-200 rounded-xl w-28"></div>
              </div>
            </div>
          </div>

          {/* Calendar Content */}
          <div className="p-6">
            {/* Calendar Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-gray-200 rounded-xl"></div>
                <div className="h-6 bg-gray-200 rounded w-36"></div>
                <div className="h-9 w-9 bg-gray-200 rounded-xl"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-9 bg-gray-200 rounded-xl w-20"></div>
                <div className="h-9 bg-gray-100 rounded-xl w-20"></div>
              </div>
            </div>

            {/* Week View */}
            <div className="border-2 border-gray-100 rounded-xl overflow-hidden">
              {/* Day Headers */}
              <div className="grid grid-cols-8 border-b border-gray-100 bg-gray-50">
                <div className="p-3 border-r border-gray-100"></div>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((_, i) => (
                  <div key={i} className="p-3 text-center border-r border-gray-100">
                    <div className="h-3 bg-gray-200 rounded w-8 mx-auto mb-1"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-8 mx-auto"></div>
                  </div>
                ))}
              </div>

              {/* Time Slots */}
              <div className="divide-y divide-gray-100">
                {Array.from({ length: 6 }).map((_, hour) => (
                  <div key={hour} className="grid grid-cols-8">
                    <div className="p-2 border-r border-gray-100 bg-gray-50">
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </div>
                    {Array.from({ length: 7 }).map((_, day) => (
                      <div key={day} className="p-1 min-h-[60px] border-r border-gray-100">
                        {(hour + day) % 4 === 0 && (
                          <div className="h-12 bg-blue-50 rounded-lg border-l-4 border-blue-400 p-2">
                            <div className="h-3 bg-blue-200 rounded w-16"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Help Section Skeleton */}
        <div className="mt-6 bg-white rounded-2xl border-2 border-gray-100 p-6 animate-pulse">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg w-8 h-8"></div>
            <div className="h-5 bg-gray-200 rounded w-28"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 bg-gray-200 rounded-full mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full overflow-x-hidden animate-fadeIn">
      {/* Header - Clean transparent style */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 bg-blue-100 rounded-xl">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Calendar</h1>
        </div>
        <p className="text-gray-500 ml-14">View your appointments and sync with Google Calendar</p>
      </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <span className="text-sm">{success}</span>
                {syncMessage && <p className="text-xs mt-0.5 text-green-600">{syncMessage}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Google Calendar Connection Status Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${status?.connected ? 'bg-green-50' : 'bg-gray-100'}`}>
                <svg className={`w-6 h-6 ${status?.connected ? 'text-green-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Google Calendar</h3>
                {status?.connected ? (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-sm text-green-600">Connected and syncing</span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Connect to sync your appointments automatically</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {status?.connected ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSync}
                  disabled={syncing || actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
                >
                  {syncing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Syncing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Sync Now
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowDisconnectModal(true)}
                  disabled={actionLoading}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 disabled:bg-gray-100 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConnectModal(true)}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Connect Google Calendar
              </button>
            )}
          </div>
        </div>

        {/* Main Calendar Card */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Calendar Header */}
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Your Appointments</h2>
          </div>

          {/* Calendar View */}
          <div className="p-6">
            <LawyerCalendarView
              onError={(err) => setError(err)}
              refreshTrigger={calendarRefreshTrigger}
            />
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How It Works
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs font-medium text-gray-600">1</div>
              <div>
                <p className="text-sm font-medium text-gray-900">View Your Schedule</p>
                <p className="text-xs text-gray-500 mt-0.5">See all your confirmed appointments in the calendar above.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs font-medium text-gray-600">2</div>
              <div>
                <p className="text-sm font-medium text-gray-900">Sync with Google</p>
                <p className="text-xs text-gray-500 mt-0.5">Connect your Google Calendar for automatic syncing.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs font-medium text-gray-600">3</div>
              <div>
                <p className="text-sm font-medium text-gray-900">Stay Organized</p>
                <p className="text-xs text-gray-500 mt-0.5">Events appear on both LegalKonect and Google Calendar.</p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              <strong>Tip:</strong> To set your weekly availability, visit the <a href="/lawyer/schedule" className="text-gray-900 underline hover:no-underline">Weekly Schedule</a> page.
            </p>
          </div>
        </div>

        {/* Connect Modal */}
        {showConnectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg border border-gray-200 max-w-md w-full animate-fadeIn">
              {/* Modal Header */}
              <div className="p-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Connect Google Calendar</h3>
                  </div>
                  <button
                    onClick={() => setShowConnectModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-600">
                  Connecting your Google Calendar will enable automatic synchronization of all your appointments.
                </p>

                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">What will happen:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>You'll be redirected to Google to authorize access</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>All confirmed appointments will sync automatically</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Events will appear on both platforms</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>You can disconnect at any time</span>
                    </li>
                  </ul>
                </div>

                <p className="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-md p-3">
                  <strong>Note:</strong> We only request permissions to manage calendar events. Your other Google data remains private.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowConnectModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConnect}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Connecting...
                      </>
                    ) : (
                      'Continue to Google'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Disconnect Modal */}
        {showDisconnectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg border border-gray-200 max-w-md w-full animate-fadeIn">
              {/* Modal Header */}
              <div className="p-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Disconnect Google Calendar</h3>
                  </div>
                  <button
                    onClick={() => setShowDisconnectModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-600">
                  Are you sure you want to disconnect your Google Calendar?
                </p>

                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-red-900 mb-3">What will happen:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-red-700">
                      <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <span>Appointments will no longer sync automatically</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-red-700">
                      <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <span>Existing synced events will remain on Google Calendar</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-red-700">
                      <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <span>You'll need to reconnect to resume syncing</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowDisconnectModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Disconnecting...
                      </>
                    ) : (
                      'Disconnect Calendar'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default LawyerGoogleCalendar;
