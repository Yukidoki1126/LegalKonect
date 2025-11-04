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
            // appointment_time contains a datetime, but we only need the time part (e.g., "12:00:00")
            $appointmentDate = Carbon::parse($appointment->appointment_date)->format('Y-m-d');
            $appointmentTime = Carbon::parse($appointment->appointment_time)->format('H:i:s');

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
     * Reads "Available" events from calendar to determine bookable slots
     */
    public function getAvailableSlotsFromCalendar(Lawyer $lawyer, string $date): array
    {
        try {
            if (!$this->refreshTokenIfNeeded($lawyer)) {
                return [];
            }

            $service = new Google_Service_Calendar($this->client);
            $calendarId = $lawyer->google_calendar_id ?? 'primary';

            // Get events for the specific date
            $timeMin = Carbon::parse($date)->startOfDay()->toRfc3339String();
            $timeMax = Carbon::parse($date)->endOfDay()->toRfc3339String();

            $events = $service->events->listEvents($calendarId, [
                'timeMin' => $timeMin,
                'timeMax' => $timeMax,
                'singleEvents' => true,
                'orderBy' => 'startTime',
            ]);

            $availableSlots = [];

            foreach ($events->getItems() as $event) {
                // Look for events with "Available" or "Consultation Hours" in the summary
                $summary = strtolower($event->getSummary() ?? '');

                if (str_contains($summary, 'available') || str_contains($summary, 'consultation')) {
                    $start = Carbon::parse($event->getStart()->getDateTime());
                    $end = Carbon::parse($event->getEnd()->getDateTime());

                    // Generate hourly slots
                    $current = $start->copy();
                    while ($current->lt($end)) {
                        $availableSlots[] = [
                            'time' => $current->format('H:i'),
                            'formatted_time' => $current->format('g:i A') . ' - ' . $current->copy()->addHour()->format('g:i A'),
                            'available' => true
                        ];
                        $current->addHour();
                    }
                }
            }

            return $availableSlots;

        } catch (\Exception $e) {
            Log::error('Failed to get available slots from Google Calendar', [
                'lawyer_id' => $lawyer->id,
                'date' => $date,
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }

    /**
     * Sync lawyer's weekly schedule to Google Calendar as recurring availability blocks
     */
    public function syncWeeklySchedule(Lawyer $lawyer, array $schedules): bool
    {
        try {
            // Increase execution time for sync operation
            set_time_limit(120); // 2 minutes

            if (!$this->refreshTokenIfNeeded($lawyer)) {
                Log::error('Cannot sync schedule: token refresh failed', ['lawyer_id' => $lawyer->id]);
                return false;
            }

            $service = new Google_Service_Calendar($this->client);
            $calendarId = $lawyer->google_calendar_id ?? 'primary';

            // Get the next 4 weeks to create availability blocks
            $startDate = Carbon::now()->startOfWeek();
            $endDate = Carbon::now()->addWeeks(4)->endOfWeek();

            // Delete all existing "Available for Consultations" events to prevent duplicates
            Log::info('Deleting old availability blocks before sync', ['lawyer_id' => $lawyer->id]);
            $this->deleteAvailabilityBlocks($lawyer, $startDate, $endDate);

            $eventsCreated = 0;
            foreach ($schedules as $schedule) {
                if (!$schedule['is_active']) {
                    continue;
                }

                // Map day of week to Carbon constant
                $dayOfWeek = $this->getDayOfWeekNumber($schedule['day_of_week']);

                // Create events for each occurrence of this day in the next 4 weeks
                $currentDate = $startDate->copy();
                while ($currentDate->lte($endDate)) {
                    if ($currentDate->dayOfWeek === $dayOfWeek) {
                        $eventStart = Carbon::parse($currentDate->toDateString() . ' ' . $schedule['start_time'], 'Asia/Manila');
                        $eventEnd = Carbon::parse($currentDate->toDateString() . ' ' . $schedule['end_time'], 'Asia/Manila');

                        // Skip if in the past
                        if ($eventStart->isPast()) {
                            $currentDate->addDay();
                            continue;
                        }

                        // Create availability block event
                        $event = new Google_Service_Calendar_Event([
                            'summary' => 'Available for Consultations',
                            'description' => 'LegalKonect availability window',
                            'start' => new Google_Service_Calendar_EventDateTime([
                                'dateTime' => $eventStart->toRfc3339String(),
                                'timeZone' => 'Asia/Manila',
                            ]),
                            'end' => new Google_Service_Calendar_EventDateTime([
                                'dateTime' => $eventEnd->toRfc3339String(),
                                'timeZone' => 'Asia/Manila',
                            ]),
                            'transparency' => 'transparent', // Won't block time on calendar
                            'colorId' => '2', // Sage green color for availability
                        ]);

                        try {
                            $service->events->insert($calendarId, $event);
                            $eventsCreated++;
                        } catch (\Exception $e) {
                            Log::warning('Failed to create availability event', [
                                'lawyer_id' => $lawyer->id,
                                'date' => $eventStart->toDateString(),
                                'error' => $e->getMessage()
                            ]);
                        }
                    }
                    $currentDate->addDay();
                }
            }

            Log::info('Weekly schedule synced to Google Calendar', [
                'lawyer_id' => $lawyer->id,
                'events_created' => $eventsCreated
            ]);
            return true;

        } catch (\Exception $e) {
            Log::error('Failed to sync weekly schedule', [
                'lawyer_id' => $lawyer->id,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Delete all "Available for Consultations" blocks in the date range
     * Used to prevent duplicates when re-syncing schedules
     */
    private function deleteAvailabilityBlocks(Lawyer $lawyer, Carbon $startDate, Carbon $endDate): void
    {
        try {
            $service = new Google_Service_Calendar($this->client);
            $calendarId = $lawyer->google_calendar_id ?? 'primary';

            // Get all events in the date range
            $timeMin = $startDate->toRfc3339String();
            $timeMax = $endDate->toRfc3339String();

            $events = $service->events->listEvents($calendarId, [
                'timeMin' => $timeMin,
                'timeMax' => $timeMax,
                'singleEvents' => true,
                'orderBy' => 'startTime',
            ]);

            $deletedCount = 0;
            foreach ($events->getItems() as $event) {
                $summary = $event->getSummary();
                $description = $event->getDescription() ?? '';

                // Delete only LegalKonect availability blocks
                if ($summary === 'Available for Consultations' &&
                    str_contains($description, 'LegalKonect availability window')) {
                    try {
                        $service->events->delete($calendarId, $event->getId());
                        $deletedCount++;
                    } catch (\Exception $e) {
                        Log::warning('Failed to delete availability event', [
                            'lawyer_id' => $lawyer->id,
                            'event_id' => $event->getId(),
                            'error' => $e->getMessage()
                        ]);
                    }
                }
            }

            Log::info('Deleted old availability blocks', [
                'lawyer_id' => $lawyer->id,
                'count' => $deletedCount
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to delete availability blocks', [
                'lawyer_id' => $lawyer->id,
                'error' => $e->getMessage()
            ]);
        }
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
