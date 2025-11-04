<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Lawyer;
use App\Models\LawyerAvailability;
use App\Models\LawyerUnavailableDate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use App\Mail\AppointmentBooked;
use Illuminate\Support\Facades\Mail;
use App\Services\GoogleCalendarService;

class AppointmentController extends Controller
{
    private GoogleCalendarService $googleCalendarService;

    public function __construct(GoogleCalendarService $googleCalendarService)
    {
        $this->googleCalendarService = $googleCalendarService;
    }

    /**
     * Get available time slots for a lawyer on a specific date
     */
    public function getAvailableSlots(Request $request, $lawyerId)
    {
        $request->validate([
            'date' => 'required|date|after_or_equal:today',
        ]);

        $lawyer = Lawyer::findOrFail($lawyerId);
        $date = Carbon::parse($request->date);

        // Convert day of week to day name (Monday, Tuesday, etc.)
        $dayName = $date->format('l'); // 'l' gives full day name like 'Monday'

        $schedules = collect();

        Log::info('Getting available slots for lawyer', [
            'lawyer_id' => $lawyerId,
            'date' => $date->format('Y-m-d'),
            'day_name' => $dayName,
            'google_calendar_connected' => $lawyer->google_calendar_connected
        ]);

        // If lawyer has Google Calendar connected, get availability from there
        if ($lawyer->google_calendar_connected) {
            Log::info('Attempting to get slots from Google Calendar', ['lawyer_id' => $lawyerId]);
            try {
                $calendarSlots = $this->getAvailabilitySlotsFromGoogleCalendar($lawyer, $date);
                if (!empty($calendarSlots)) {
                    $schedules = collect($calendarSlots);
                    Log::info('Using Google Calendar schedules', [
                        'lawyer_id' => $lawyerId,
                        'slot_count' => count($calendarSlots)
                    ]);
                } else {
                    Log::warning('Google Calendar returned no slots', ['lawyer_id' => $lawyerId]);
                }
            } catch (\Exception $e) {
                Log::warning('Failed to get Google Calendar slots, falling back to database', [
                    'lawyer_id' => $lawyerId,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
        } else {
            Log::info('Google Calendar not connected, using database schedules', ['lawyer_id' => $lawyerId]);
        }

        // Fallback to database schedules if no Google Calendar slots found
        if ($schedules->isEmpty()) {
            Log::info('Falling back to database schedules', ['lawyer_id' => $lawyerId, 'day_name' => $dayName]);
            $schedules = DB::table('lawyer_schedules')
                ->where('lawyer_id', $lawyerId)
                ->where('day_of_week', $dayName)
                ->where('is_active', true)
                ->orderBy('start_time')
                ->get();
            Log::info('Database schedules retrieved', [
                'lawyer_id' => $lawyerId,
                'schedule_count' => $schedules->count()
            ]);
        }

        if ($schedules->isEmpty()) {
            return response()->json([
                'available' => false,
                'message' => 'Lawyer has no schedules set for this day',
                'slots' => []
            ]);
        }

        // Check if this specific date is blocked
        $isBlocked = DB::table('lawyer_unavailable_dates')
            ->where('lawyer_id', $lawyerId)
            ->where('unavailable_date', $date->format('Y-m-d'))
            ->exists();

        if ($isBlocked) {
            return response()->json([
                'available' => false,
                'message' => 'Lawyer is not available on this date',
                'slots' => []
            ]);
        }

        // Get existing appointments for this date (get raw time strings)
        $existingAppointments = Appointment::where('lawyer_id', $lawyerId)
            ->where('appointment_date', $date->format('Y-m-d'))
            ->whereIn('status', ['pending', 'confirmed'])
            ->pluck('appointment_time')
            ->map(function($time) {
                // Convert time to H:i format if needed
                if ($time instanceof \Carbon\Carbon) {
                    return $time->format('H:i');
                }
                return substr($time, 0, 5); // Get H:i from H:i:s
            })
            ->toArray();

        // Generate time slots from all schedules for this day
        $slots = [];

        Log::info('Generating time slots', [
            'lawyer_id' => $lawyerId,
            'date' => $date->format('Y-m-d'),
            'schedule_count' => $schedules->count(),
            'schedules' => $schedules->toArray()
        ]);

        foreach ($schedules as $schedule) {
            $startTime = Carbon::parse($schedule->start_time);
            $endTime = Carbon::parse($schedule->end_time);

            Log::info('Processing schedule', [
                'start_time_raw' => $schedule->start_time,
                'end_time_raw' => $schedule->end_time,
                'start_time_parsed' => $startTime->format('Y-m-d H:i:s'),
                'end_time_parsed' => $endTime->format('Y-m-d H:i:s')
            ]);

            while ($startTime->lt($endTime)) {
                $slotTime = $startTime->format('H:i');

                // Check if this slot is already booked
                $isBooked = in_array($slotTime, $existingAppointments);

                // Check if slot is in the past (for today's date)
                $isPast = false;
                if ($date->isToday()) {
                    $slotDateTime = Carbon::parse($date->format('Y-m-d') . ' ' . $slotTime);
                    $isPast = $slotDateTime->lt(now());
                }

                // Check if slot already exists (in case of overlapping schedules)
                $slotExists = collect($slots)->contains('time', $slotTime);

                Log::info('Evaluating slot', [
                    'slot_time' => $slotTime,
                    'is_booked' => $isBooked,
                    'is_past' => $isPast,
                    'slot_exists' => $slotExists,
                    'will_add' => !$isBooked && !$isPast && !$slotExists
                ]);

                if (!$isBooked && !$isPast && !$slotExists) {
                    $endSlotTime = $startTime->copy()->addHour();
                    $slots[] = [
                        'time' => $slotTime,
                        'formatted_time' => $startTime->format('g:i A') . ' - ' . $endSlotTime->format('g:i A'),
                        'available' => true
                    ];
                    Log::info('Slot added', ['slot_time' => $slotTime, 'formatted' => $startTime->format('g:i A') . ' - ' . $endSlotTime->format('g:i A')]);
                }

                $startTime->addHour();
            }
        }

        Log::info('Final slots generated', [
            'lawyer_id' => $lawyerId,
            'slot_count' => count($slots),
            'slots' => $slots
        ]);

        // Sort slots by time
        usort($slots, function($a, $b) {
            return strcmp($a['time'], $b['time']);
        });

        return response()->json([
            'available' => count($slots) > 0,
            'date' => $date->format('Y-m-d'),
            'day_of_week' => $date->format('l'),
            'slots' => $slots,
            'hourly_rate' => $lawyer->hourly_rate
        ]);
    }

    /**
     * Create a new appointment
     */
  public function store(Request $request)
{
    $request->validate([
        'lawyer_id' => 'required|exists:lawyers,id',
        'appointment_date' => 'required|date|after_or_equal:today',
        'appointment_time' => 'required|date_format:H:i',
        'client_notes' => 'nullable|string|max:1000',
        'meeting_type' => 'nullable|in:in-person,video,phone',
    ]);

    $lawyer = Lawyer::findOrFail($request->lawyer_id);
    $user = auth()->user();

    // Use database transaction with locking to prevent race conditions
    try {
        $appointment = DB::transaction(function () use ($request, $lawyer, $user) {
            // Verify the slot is still available with row locking
            $existingAppointment = Appointment::where('lawyer_id', $request->lawyer_id)
                ->where('appointment_date', $request->appointment_date)
                ->where('appointment_time', $request->appointment_time)
                ->whereIn('status', ['pending', 'confirmed'])
                ->lockForUpdate() // Locks the rows for update, preventing concurrent bookings
                ->exists();

            if ($existingAppointment) {
                throw new \Exception('This time slot has already been booked by another user. Please select a different time.');
            }

            // Check if user already has an appointment with this lawyer at this time
            $userDuplicateBooking = Appointment::where('user_id', $user->id)
                ->where('lawyer_id', $request->lawyer_id)
                ->where('appointment_date', $request->appointment_date)
                ->where('appointment_time', $request->appointment_time)
                ->whereIn('status', ['pending', 'confirmed'])
                ->exists();

            if ($userDuplicateBooking) {
                throw new \Exception('You already have an appointment booked at this time with this lawyer.');
            }

            // Create the appointment
            $appointment = Appointment::create([
                'user_id' => $user->id,
                'lawyer_id' => $request->lawyer_id,
                'appointment_date' => $request->appointment_date,
                'appointment_time' => $request->appointment_time,
                'duration_minutes' => 60,
                'status' => 'pending',
                'consultation_fee' => $lawyer->hourly_rate,
                'payment_status' => 'unpaid',
                'client_notes' => $request->client_notes,
                'meeting_type' => $request->meeting_type ?? 'in-person',
            ]);

            return $appointment;
        });

        // Load relationships
        $appointment->load(['lawyer.specializations', 'user']);

        // Create Google Calendar event if lawyer has Google Calendar connected
        if ($lawyer->google_calendar_connected) {
            try {
                $googleCalendarService = app(GoogleCalendarService::class);
                $eventId = $googleCalendarService->createAppointmentEvent($lawyer, $appointment);

                if ($eventId) {
                    $appointment->update(['google_event_id' => $eventId]);
                    Log::info('Google Calendar event created for appointment', [
                        'appointment_id' => $appointment->id,
                        'event_id' => $eventId
                    ]);
                }
            } catch (\Exception $e) {
                // Log the error but don't fail the appointment creation
                Log::error('Failed to create Google Calendar event: ' . $e->getMessage());
            }
        }

        // Send confirmation email
        try {
            Mail::to($user->email)->send(new AppointmentBooked($appointment));
        } catch (\Exception $e) {
            // Log the error but don't fail the appointment creation
            \Log::error('Failed to send appointment confirmation email: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Appointment booked successfully!',
            'appointment' => $appointment
        ], 201);

    } catch (\Exception $e) {
        Log::error('Appointment booking failed: ' . $e->getMessage());

        return response()->json([
            'message' => $e->getMessage()
        ], 422);
    }
}
    /**
     * Get user's appointments
     */
    public function getUserAppointments(Request $request)
{
    $type = $request->query('type', 'upcoming');
    
    \Log::info('Fetching appointments', [
        'user_id' => auth()->id(),
        'type' => $type
    ]);

    $query = Appointment::with(['lawyer.specializations', 'review'])  // ADD 'review' here
        ->where('user_id', auth()->id());

    if ($type === 'upcoming') {
        $query->whereIn('status', ['pending', 'confirmed'])
              ->orderBy('appointment_date', 'asc')
              ->orderBy('appointment_time', 'asc');
    } else {
        $query->whereIn('status', ['completed', 'cancelled', 'no_show'])
              ->orderBy('appointment_date', 'desc')
              ->orderBy('appointment_time', 'desc');
    }

    $appointments = $query->get();

    \Log::info('Appointments fetched', ['count' => $appointments->count()]);

    return response()->json([
        'appointments' => $appointments
    ]);
}

    /**
     * Get a single appointment - FIXED for payment page
     */
    public function show($id)
    {
        try {
            // Get authenticated user
            $user = auth()->user();
            
            // Log for debugging
            Log::info('Appointment show request', [
                'appointment_id' => $id,
                'user_id' => $user->id,
                'user_email' => $user->email
            ]);

            // Find appointment with related data
            $appointment = Appointment::with(['lawyer.specializations', 'lawyer.user', 'user'])
                ->find($id);

            if (!$appointment) {
                Log::warning('Appointment not found', ['id' => $id]);
                return response()->json([
                    'message' => 'Appointment not found'
                ], 404);
            }

            // Log for debugging
            Log::info('Appointment ownership check', [
                'appointment_user_id' => $appointment->user_id,
                'authenticated_user_id' => $user->id,
                'match' => $appointment->user_id == $user->id
            ]);

            // Verify user owns this appointment - FIXED comparison
            if ($appointment->user_id != $user->id) {
                Log::warning('Unauthorized appointment access', [
                    'appointment_id' => $id,
                    'appointment_user_id' => $appointment->user_id,
                    'requesting_user_id' => $user->id
                ]);
                
                return response()->json([
                    'message' => 'Unauthorized access to this appointment'
                ], 403);
            }

            return response()->json([
                'appointment' => $appointment
            ]);

        } catch (\Exception $e) {
            Log::error('Error in appointment show', [
                'appointment_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Error fetching appointment',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Cancel an appointment
     */
    public function cancel(Request $request, $id)
    {
        $request->validate([
            'cancellation_reason' => 'required|string|max:500',
        ]);

        $appointment = Appointment::findOrFail($id);

        // Verify user owns this appointment
        if ($appointment->user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if appointment can be cancelled
        if (!$appointment->canBeCancelled()) {
            return response()->json([
                'message' => 'This appointment cannot be cancelled'
            ], 422);
        }

        $appointment->update([
            'status' => 'cancelled',
            'cancellation_reason' => $request->cancellation_reason,
            'cancelled_at' => now(),
            'cancelled_by' => auth()->id(),
        ]);

        return response()->json([
            'message' => 'Appointment cancelled successfully',
            'appointment' => $appointment
        ]);
    }

    /**
     * Get availability slots from Google Calendar for a specific date
     * Parses "Available for Consultations" events from Google Calendar
     */
    private function getAvailabilitySlotsFromGoogleCalendar(Lawyer $lawyer, Carbon $date): array
    {
        $dateString = $date->format('Y-m-d');

        Log::info('Fetching Google Calendar events for lawyer', [
            'lawyer_id' => $lawyer->id,
            'date' => $dateString,
            'google_calendar_connected' => $lawyer->google_calendar_connected
        ]);

        // Get events from Google Calendar for this specific date
        $events = $this->googleCalendarService->getEvents($lawyer, $dateString, $dateString);

        Log::info('Google Calendar events retrieved', [
            'lawyer_id' => $lawyer->id,
            'date' => $dateString,
            'event_count' => count($events),
            'events' => $events
        ]);

        $schedules = [];

        foreach ($events as $event) {
            // Look for "Available for Consultations" events (the synced availability blocks)
            $summary = strtolower($event['summary'] ?? '');

            Log::info('Processing Google Calendar event', [
                'summary' => $event['summary'] ?? 'No summary',
                'summary_lower' => $summary,
                'start' => $event['start'] ?? 'No start',
                'end' => $event['end'] ?? 'No end',
                'is_all_day' => $event['is_all_day'] ?? false,
                'contains_available' => str_contains($summary, 'available'),
                'contains_consultations' => str_contains($summary, 'consultations')
            ]);

            if (str_contains($summary, 'available') && str_contains($summary, 'consultations')) {
                // This is an availability block
                if (!$event['is_all_day']) {
                    $start = Carbon::parse($event['start']);
                    $end = Carbon::parse($event['end']);

                    Log::info('Adding schedule from Google Calendar', [
                        'start_time' => $start->format('H:i:s'),
                        'end_time' => $end->format('H:i:s')
                    ]);

                    // Add as a schedule object (compatible with existing code)
                    $schedules[] = (object) [
                        'start_time' => $start->format('H:i:s'),
                        'end_time' => $end->format('H:i:s'),
                    ];
                }
            }
        }

        Log::info('Google Calendar schedules parsed', [
            'lawyer_id' => $lawyer->id,
            'date' => $dateString,
            'schedule_count' => count($schedules),
            'schedules' => $schedules
        ]);

        return $schedules;
    }
}