<?php

namespace App\Services;

use App\Models\Lawyer;
use App\Models\Appointment;
use Google_Client;
use Google_Service_Calendar;
use Google_Service_Calendar_Event;
use Google_Service_Calendar_EventDateTime;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class GoogleCalendarService
{
    private Google_Client $client;

    public function __construct()
    {
        $this->client = new Google_Client();
        $this->client->setClientId(config('google.client_id'));
        $this->client->setClientSecret(config('google.client_secret'));
        $this->client->setRedirectUri(config('google.redirect_uri'));
        $this->client->setScopes(config('google.scopes'));
        $this->client->setAccessType('offline');
        $this->client->setPrompt('consent');
    }

    /**
     * Get the OAuth authorization URL
     */
    public function getAuthUrl(?int $userId = null): string
    {
        // Add user ID to state parameter to identify the user after OAuth callback
        if ($userId) {
            $state = base64_encode(json_encode([
                'user_id' => $userId,
                'timestamp' => time(),
            ]));
            $this->client->setState($state);
        }

        return $this->client->createAuthUrl();
    }

    /**
     * Exchange authorization code for access token
     */
    public function exchangeCodeForToken(string $code): array
    {
        return $this->client->fetchAccessTokenWithAuthCode($code);
    }

    /**
     * Set access token for the client
     */
    public function setAccessToken(array $token): void
    {
        $this->client->setAccessToken($token);
    }

    /**
     * Refresh the access token if expired
     */
    public function refreshTokenIfNeeded(Lawyer $lawyer): bool
    {
        try {
            if (!$lawyer->google_access_token) {
                return false;
            }

            $accessToken = json_decode($lawyer->google_access_token, true);

            $this->client->setAccessToken($accessToken);

            // Check if token is expired
            if ($this->client->isAccessTokenExpired()) {
                Log::info('Access token expired, refreshing...', ['lawyer_id' => $lawyer->id]);

                $refreshToken = $lawyer->google_refresh_token;

                if (!$refreshToken) {
                    Log::error('No refresh token available', ['lawyer_id' => $lawyer->id]);
                    return false;
                }

                $this->client->refreshToken($refreshToken);
                $newAccessToken = $this->client->getAccessToken();

                // Update lawyer's tokens
                $lawyer->update([
                    'google_access_token' => json_encode($newAccessToken),
                    'google_token_expires_at' => Carbon::now()->addSeconds($newAccessToken['expires_in'] ?? 3600),
                ]);

                Log::info('Access token refreshed successfully', ['lawyer_id' => $lawyer->id]);
            }

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to refresh token', [
                'lawyer_id' => $lawyer->id,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Create an event in Google Calendar for an appointment
     */
    public function createAppointmentEvent(Lawyer $lawyer, Appointment $appointment): ?string
    {
        try {
            if (!$this->refreshTokenIfNeeded($lawyer)) {
                Log::error('Cannot create event: token refresh failed', ['lawyer_id' => $lawyer->id]);
                return null;
            }

            $service = new Google_Service_Calendar($this->client);

            // Get primary calendar ID
            $calendarId = $lawyer->google_calendar_id ?? 'primary';

            // Parse the appointment date and time correctly
            // appointment_date contains the date (e.g., "2025-11-06")
            // appointment_time should be a time string (e.g., "12:00:00")
            $appointmentDate = Carbon::parse($appointment->appointment_date)->format('Y-m-d');

            // Extract just the time portion, handling both time strings and datetime strings
            $timeString = $appointment->appointment_time;
            if (strlen($timeString) > 8) {
                // If it's a full datetime string, extract just the time part
                $appointmentTime = Carbon::parse($timeString)->format('H:i:s');
            } else {
                // It's already a time string
                $appointmentTime = $timeString;
            }

            // Combine date and time
            $startDateTime = Carbon::parse($appointmentDate . ' ' . $appointmentTime, 'Asia/Manila');
            $endDateTime = $startDateTime->copy()->addMinutes((int) $appointment->duration_minutes);

            Log::info('Creating Google Calendar event', [
                'lawyer_id' => $lawyer->id,
                'appointment_id' => $appointment->id,
                'raw_date' => $appointment->appointment_date,
                'raw_time' => $appointment->appointment_time,
                'parsed_date' => $appointmentDate,
                'parsed_time' => $appointmentTime,
                'start_datetime' => $startDateTime->toRfc3339String(),
                'end_datetime' => $endDateTime->toRfc3339String()
            ]);

            // Create event
            $event = new Google_Service_Calendar_Event([
                'summary' => 'Consultation - ' . $appointment->user->name,
                'description' => "Client: {$appointment->user->name}\nEmail: {$appointment->user->email}\nMeeting Type: {$appointment->meeting_type}\n\nClient Notes:\n{$appointment->client_notes}",
                'start' => new Google_Service_Calendar_EventDateTime([
                    'dateTime' => $startDateTime->toRfc3339String(),
                    'timeZone' => 'Asia/Manila',
                ]),
                'end' => new Google_Service_Calendar_EventDateTime([
                    'dateTime' => $endDateTime->toRfc3339String(),
                    'timeZone' => 'Asia/Manila',
                ]),
                'attendees' => [
                    ['email' => $appointment->user->email],
                ],
                'reminders' => [
                    'useDefault' => false,
                    'overrides' => [
                        ['method' => 'email', 'minutes' => 24 * 60], // 1 day before
                        ['method' => 'popup', 'minutes' => 60], // 1 hour before
                    ],
                ],
            ]);

            $createdEvent = $service->events->insert($calendarId, $event);

            Log::info('Google Calendar event created', [
                'lawyer_id' => $lawyer->id,
                'appointment_id' => $appointment->id,
                'event_id' => $createdEvent->getId()
            ]);

            return $createdEvent->getId();

        } catch (\Exception $e) {
            Log::error('Failed to create Google Calendar event', [
                'lawyer_id' => $lawyer->id,
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Update an event in Google Calendar
     */
    public function updateAppointmentEvent(Lawyer $lawyer, Appointment $appointment, string $eventId): bool
    {
        try {
            if (!$this->refreshTokenIfNeeded($lawyer)) {
                return false;
            }

            $service = new Google_Service_Calendar($this->client);
            $calendarId = $lawyer->google_calendar_id ?? 'primary';

            // Get existing event
            $event = $service->events->get($calendarId, $eventId);

            // Update event details
            $event->setSummary('Consultation - ' . $appointment->user->name . ' [' . strtoupper($appointment->status) . ']');
            $event->setDescription("Client: {$appointment->user->name}\nEmail: {$appointment->user->email}\nMeeting Type: {$appointment->meeting_type}\nStatus: {$appointment->status}\n\nClient Notes:\n{$appointment->client_notes}");

            $service->events->update($calendarId, $eventId, $event);

            Log::info('Google Calendar event updated', [
                'lawyer_id' => $lawyer->id,
                'appointment_id' => $appointment->id,
                'event_id' => $eventId
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Failed to update Google Calendar event', [
                'lawyer_id' => $lawyer->id,
                'appointment_id' => $appointment->id,
                'event_id' => $eventId,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Delete an event from Google Calendar
     */
    public function deleteAppointmentEvent(Lawyer $lawyer, string $eventId): bool
    {
        try {
            if (!$this->refreshTokenIfNeeded($lawyer)) {
                return false;
            }

            $service = new Google_Service_Calendar($this->client);
            $calendarId = $lawyer->google_calendar_id ?? 'primary';

            $service->events->delete($calendarId, $eventId);

            Log::info('Google Calendar event deleted', [
                'lawyer_id' => $lawyer->id,
                'event_id' => $eventId
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Failed to delete Google Calendar event', [
                'lawyer_id' => $lawyer->id,
                'event_id' => $eventId,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Get available time slots from Google Calendar
     * DISABLED: No longer syncing availability to Google Calendar
     * Use database schedules instead
     */
    public function getAvailableSlotsFromCalendar(Lawyer $lawyer, string $date): array
    {
        // No longer reading availability from Google Calendar
        // Return empty array to force fallback to database schedules
        Log::info('getAvailableSlotsFromCalendar called but disabled - using database schedules instead', [
            'lawyer_id' => $lawyer->id,
            'date' => $date
        ]);
        return [];
    }

    /**
     * Sync lawyer's weekly schedule to Google Calendar as recurring availability blocks
     * DISABLED: No longer syncing availability to Google Calendar
     * Only actual consultations are synced now
     */
    public function syncWeeklySchedule(Lawyer $lawyer, array $schedules): bool
    {
        // No longer syncing availability blocks to Google Calendar
        // Only actual booked consultations will appear on the calendar
        Log::info('syncWeeklySchedule called but disabled - availability no longer synced to Google Calendar', [
            'lawyer_id' => $lawyer->id,
            'schedule_count' => count($schedules)
        ]);

        // Return true to indicate successful "sync" (even though we're not doing anything)
        return true;
    }

    /**
     * Delete all "Available for Consultations" blocks in the date range
     * DISABLED: No longer needed since we don't sync availability
     */
    private function deleteAvailabilityBlocks(Lawyer $lawyer, Carbon $startDate, Carbon $endDate): void
    {
        // No longer deleting availability blocks since we don't create them anymore
        Log::info('deleteAvailabilityBlocks called but disabled', [
            'lawyer_id' => $lawyer->id
        ]);
    }

    /**
     * Convert day of week string to Carbon day number
     */
    private function getDayOfWeekNumber(string $dayOfWeek): int
    {
        $days = [
            'Sunday' => Carbon::SUNDAY,
            'Monday' => Carbon::MONDAY,
            'Tuesday' => Carbon::TUESDAY,
            'Wednesday' => Carbon::WEDNESDAY,
            'Thursday' => Carbon::THURSDAY,
            'Friday' => Carbon::FRIDAY,
            'Saturday' => Carbon::SATURDAY,
        ];

        return $days[$dayOfWeek] ?? Carbon::MONDAY;
    }

    /**
     * Get the user's email address from their Google account
     */
    public function getUserEmail(Lawyer $lawyer): ?string
    {
        try {
            if (!$this->refreshTokenIfNeeded($lawyer)) {
                return null;
            }

            $service = new Google_Service_Calendar($this->client);
            $calendarList = $service->calendarList->get('primary');

            return $calendarList->getId();
        } catch (\Exception $e) {
            Log::error('Failed to get user email', [
                'lawyer_id' => $lawyer->id,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Get calendar events for a specific date range
     */
    public function getEvents(Lawyer $lawyer, string $startDate, string $endDate): array
    {
        try {
            if (!$this->refreshTokenIfNeeded($lawyer)) {
                return [];
            }

            $service = new Google_Service_Calendar($this->client);
            $calendarId = $lawyer->google_calendar_id ?? 'primary';

            $timeMin = Carbon::parse($startDate)->startOfDay()->toRfc3339String();
            $timeMax = Carbon::parse($endDate)->endOfDay()->toRfc3339String();

            $events = $service->events->listEvents($calendarId, [
                'timeMin' => $timeMin,
                'timeMax' => $timeMax,
                'singleEvents' => true,
                'orderBy' => 'startTime',
            ]);

            $eventList = [];
            foreach ($events->getItems() as $event) {
                $start = $event->getStart()->getDateTime() ?? $event->getStart()->getDate();
                $end = $event->getEnd()->getDateTime() ?? $event->getEnd()->getDate();

                $eventData = [
                    'id' => $event->getId(),
                    'summary' => $event->getSummary(),
                    'description' => $event->getDescription(),
                    'start' => $start,
                    'end' => $end,
                    'color' => $event->getColorId(),
                    'is_all_day' => !$event->getStart()->getDateTime(),
                ];

                Log::info('Google Calendar event retrieved', [
                    'lawyer_id' => $lawyer->id,
                    'event' => $eventData
                ]);

                $eventList[] = $eventData;
            }

            // Log consultation events separately for debugging
            $consultationEvents = array_filter($eventList, function($event) {
                return strpos($event['summary'], 'Consultation -') === 0;
            });

            Log::info('All Google Calendar events retrieved', [
                'lawyer_id' => $lawyer->id,
                'total_count' => count($eventList),
                'consultation_count' => count($consultationEvents),
                'consultation_events' => array_map(function($e) {
                    return [
                        'summary' => $e['summary'],
                        'start' => $e['start'],
                        'end' => $e['end']
                    ];
                }, $consultationEvents)
            ]);

            return $eventList;

        } catch (\Exception $e) {
            Log::error('Failed to get calendar events', [
                'lawyer_id' => $lawyer->id,
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }

    /**
     * Disconnect Google Calendar for a lawyer
     */
    public function disconnect(Lawyer $lawyer): bool
    {
        try {
            // Revoke the token if possible
            if ($lawyer->google_access_token) {
                $accessToken = json_decode($lawyer->google_access_token, true);
                $this->client->revokeToken($accessToken);
            }
        } catch (\Exception $e) {
            Log::warning('Failed to revoke Google token', [
                'lawyer_id' => $lawyer->id,
                'error' => $e->getMessage()
            ]);
        }

        // Clear all Google Calendar data
        $lawyer->update([
            'google_access_token' => null,
            'google_refresh_token' => null,
            'google_token_expires_at' => null,
            'google_calendar_id' => null,
            'google_calendar_connected' => false,
        ]);

        return true;
    }
}
