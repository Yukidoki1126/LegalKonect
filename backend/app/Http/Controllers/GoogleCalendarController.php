<?php

namespace App\Http\Controllers;

use App\Services\GoogleCalendarService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class GoogleCalendarController extends Controller
{
    private GoogleCalendarService $googleCalendarService;

    public function __construct(GoogleCalendarService $googleCalendarService)
    {
        $this->googleCalendarService = $googleCalendarService;
    }

    /**
     * Get the Google OAuth authorization URL
     */
    public function getAuthUrl(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->lawyer) {
                return response()->json([
                    'message' => 'Not a lawyer'
                ], 403);
            }

            $authUrl = $this->googleCalendarService->getAuthUrl($user->id);

            return response()->json([
                'auth_url' => $authUrl
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get Google auth URL', ['error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Failed to generate authorization URL'
            ], 500);
        }
    }

    /**
     * Handle the OAuth callback from Google
     */
    public function handleCallback(Request $request)
    {
        try {
            $code = $request->query('code');
            $state = $request->query('state');

            if (!$code) {
                return redirect(config('app.frontend_url', 'http://localhost:5173') . '/lawyer/calendar?error=no_code');
            }

            // Decode state parameter to get user ID
            $userId = null;
            if ($state) {
                $stateData = json_decode(base64_decode($state), true);
                $userId = $stateData['user_id'] ?? null;
            }

            if (!$userId) {
                Log::error('Google Calendar callback: No user ID in state');
                return redirect(config('app.frontend_url', 'http://localhost:5173') . '/lawyer/calendar?error=invalid_state');
            }

            // Find the user
            $user = \App\Models\User::find($userId);

            if (!$user || !$user->lawyer) {
                Log::error('Google Calendar callback: User not found or not a lawyer', ['user_id' => $userId]);
                return redirect(config('app.frontend_url', 'http://localhost:5173') . '/lawyer/calendar?error=not_lawyer');
            }

            // Exchange code for token
            $token = $this->googleCalendarService->exchangeCodeForToken($code);

            if (!isset($token['access_token'])) {
                throw new \Exception('No access token in response');
            }

            $lawyer = $user->lawyer;

            // Store tokens
            $lawyer->update([
                'google_access_token' => json_encode($token),
                'google_refresh_token' => $token['refresh_token'] ?? $lawyer->google_refresh_token,
                'google_token_expires_at' => Carbon::now()->addSeconds($token['expires_in'] ?? 3600),
                'google_calendar_connected' => true,
            ]);

            Log::info('Google Calendar connected successfully', ['lawyer_id' => $lawyer->id, 'user_id' => $userId]);

            // Redirect back to frontend
            return redirect(config('app.frontend_url', 'http://localhost:5173') . '/lawyer/calendar?success=true');

        } catch (\Exception $e) {
            Log::error('Google Calendar callback failed', ['error' => $e->getMessage()]);

            return redirect(config('app.frontend_url', 'http://localhost:5173') . '/lawyer/calendar?error=callback_failed');
        }
    }

    /**
     * Get connection status
     */
    public function getStatus()
    {
        try {
            $user = auth()->user();

            if (!$user || !$user->lawyer) {
                return response()->json([
                    'connected' => false,
                    'message' => 'Not a lawyer'
                ], 403);
            }

            $lawyer = $user->lawyer;

            // Get the user's email from their Google account if connected
            $calendarEmail = null;
            if ($lawyer->google_calendar_connected) {
                try {
                    $calendarEmail = $this->googleCalendarService->getUserEmail($lawyer);
                } catch (\Exception $e) {
                    Log::warning('Could not fetch calendar email', ['error' => $e->getMessage()]);
                }
            }

            return response()->json([
                'connected' => (bool) $lawyer->google_calendar_connected,
                'calendar_id' => $lawyer->google_calendar_id,
                'calendar_email' => $calendarEmail,
                'connected_at' => $lawyer->google_token_expires_at ? $lawyer->updated_at->toDateTimeString() : null,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get calendar status', ['error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Failed to get status'
            ], 500);
        }
    }

    /**
     * Disconnect Google Calendar
     */
    public function disconnect()
    {
        try {
            $user = auth()->user();

            if (!$user || !$user->lawyer) {
                return response()->json([
                    'message' => 'Not a lawyer'
                ], 403);
            }

            $lawyer = $user->lawyer;

            $this->googleCalendarService->disconnect($lawyer);

            Log::info('Google Calendar disconnected', ['lawyer_id' => $lawyer->id]);

            return response()->json([
                'message' => 'Google Calendar disconnected successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to disconnect calendar', ['error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Failed to disconnect calendar'
            ], 500);
        }
    }

    /**
     * Sync weekly schedules to Google Calendar
     * DISABLED: Availability is no longer synced to Google Calendar
     * Only actual consultations are synced
     */
    public function syncSchedules()
    {
        try {
            $user = auth()->user();

            if (!$user || !$user->lawyer) {
                return response()->json([
                    'message' => 'Not a lawyer'
                ], 403);
            }

            $lawyer = $user->lawyer;

            if (!$lawyer->google_calendar_connected) {
                return response()->json([
                    'message' => 'Google Calendar not connected'
                ], 400);
            }

            // No longer syncing availability blocks to Google Calendar
            // Only actual booked consultations will appear on the calendar
            Log::info('syncSchedules endpoint called but disabled', [
                'lawyer_id' => $lawyer->id
            ]);

            return response()->json([
                'message' => 'Availability schedules are managed in the database only. Only confirmed consultations will appear on your Google Calendar.'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to process sync schedules request', ['error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Failed to process request'
            ], 500);
        }
    }

    /**
     * Get calendar events for a date range
     */
    public function getEvents(Request $request)
    {
        try {
            $user = auth()->user();

            if (!$user || !$user->lawyer) {
                return response()->json([
                    'message' => 'Not a lawyer'
                ], 403);
            }

            $lawyer = $user->lawyer;

            if (!$lawyer->google_calendar_connected) {
                return response()->json([
                    'message' => 'Google Calendar not connected'
                ], 400);
            }

            $validated = $request->validate([
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
            ]);

            $events = $this->googleCalendarService->getEvents(
                $lawyer,
                $validated['start_date'],
                $validated['end_date']
            );

            return response()->json([
                'events' => $events
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get calendar events', ['error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Failed to get calendar events'
            ], 500);
        }
    }

    /**
     * Sync existing appointments to Google Calendar
     * This is useful for appointments that failed to sync during creation
     */
    public function syncAppointments(Request $request)
    {
        try {
            $user = auth()->user();

            if (!$user || !$user->lawyer) {
                return response()->json([
                    'message' => 'Not a lawyer'
                ], 403);
            }

            $lawyer = $user->lawyer;

            if (!$lawyer->google_calendar_connected) {
                return response()->json([
                    'message' => 'Google Calendar not connected'
                ], 400);
            }

            // Get all confirmed appointments without google_event_id
            $appointments = \App\Models\Appointment::where('lawyer_id', $lawyer->id)
                ->whereIn('status', ['confirmed', 'pending'])
                ->whereNull('google_event_id')
                ->with('user')
                ->get();

            $synced = 0;
            $failed = 0;
            $errors = [];

            foreach ($appointments as $appointment) {
                try {
                    $eventId = $this->googleCalendarService->createAppointmentEvent($lawyer, $appointment);

                    if ($eventId) {
                        $appointment->update(['google_event_id' => $eventId]);
                        $synced++;

                        Log::info('Appointment synced to Google Calendar', [
                            'appointment_id' => $appointment->id,
                            'event_id' => $eventId
                        ]);
                    } else {
                        $failed++;
                        $errors[] = "Appointment #{$appointment->id} failed to sync";
                    }
                } catch (\Exception $e) {
                    $failed++;
                    $errors[] = "Appointment #{$appointment->id}: " . $e->getMessage();

                    Log::error('Failed to sync appointment', [
                        'appointment_id' => $appointment->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            return response()->json([
                'message' => "Synced {$synced} appointments to Google Calendar",
                'synced' => $synced,
                'failed' => $failed,
                'total' => $appointments->count(),
                'errors' => $errors
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to sync appointments', ['error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Failed to sync appointments'
            ], 500);
        }
    }
}
