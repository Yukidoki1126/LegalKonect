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
use App\Mail\NewAppointmentForLawyer;
use App\Mail\RescheduleRequest;
use Illuminate\Support\Facades\Mail;
use App\Services\GoogleCalendarService;
use App\Services\NotificationService;

class AppointmentController extends Controller
{
    private GoogleCalendarService $googleCalendarService;
    private NotificationService $notificationService;

    public function __construct(GoogleCalendarService $googleCalendarService, NotificationService $notificationService)
    {
        $this->googleCalendarService = $googleCalendarService;
        $this->notificationService = $notificationService;
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

        // No longer using Google Calendar for availability slots
        // Only database schedules are used for availability
        // Google Calendar is only for displaying confirmed consultations
        Log::info('Using database schedules for availability (Google Calendar sync disabled)', ['lawyer_id' => $lawyerId]);

        // Get schedules from database
        if ($schedules->isEmpty()) {
            Log::info('Getting schedules from database', ['lawyer_id' => $lawyerId, 'day_name' => $dayName]);
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

        // Check daily appointment limit for this day
        $scheduleWithLimit = DB::table('lawyer_schedules')
            ->where('lawyer_id', $lawyerId)
            ->where('day_of_week', $dayName)
            ->where('is_active', true)
            ->whereNotNull('daily_appointment_limit')
            ->first();

        $dailyLimit = $scheduleWithLimit->daily_appointment_limit ?? null;

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

        // Check if daily limit has been reached
        if ($dailyLimit !== null && count($existingAppointments) >= $dailyLimit) {
            return response()->json([
                'available' => false,
                'message' => 'Daily appointment limit reached for this date',
                'slots' => [],
                'limit_reached' => true,
                'daily_limit' => $dailyLimit,
                'booked_count' => count($existingAppointments)
            ]);
        }

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
                    'will_add' => !$isPast && !$slotExists
                ]);

                // Add all slots (not past, not duplicate) - mark booked ones as unavailable
                if (!$isPast && !$slotExists) {
                    $endSlotTime = $startTime->copy()->addHour();
                    $slots[] = [
                        'time' => $slotTime,
                        'formatted_time' => $startTime->format('g:i A') . ' - ' . $endSlotTime->format('g:i A'),
                        'available' => !$isBooked  // false if booked, true if available
                    ];
                    Log::info('Slot added', ['slot_time' => $slotTime, 'formatted' => $startTime->format('g:i A') . ' - ' . $endSlotTime->format('g:i A'), 'available' => !$isBooked]);
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

        // Check if any slots are available (not booked)
        $hasAvailableSlots = collect($slots)->contains('available', true);

        return response()->json([
            'available' => $hasAvailableSlots,
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
        'specialization_id' => 'nullable|exists:specializations,id',
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

            // Create the appointment with confirmed status (auto-confirm since lawyer set availability)
            $appointment = Appointment::create([
                'user_id' => $user->id,
                'lawyer_id' => $request->lawyer_id,
                'specialization_id' => $request->specialization_id,
                'appointment_date' => $request->appointment_date,
                'appointment_time' => $request->appointment_time,
                'duration_minutes' => 60,
                'status' => 'confirmed',
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

        // Send confirmation email to client
        try {
            Mail::to($user->email)->send(new AppointmentBooked($appointment));
        } catch (\Exception $e) {
            // Log the error but don't fail the appointment creation
            \Log::error('Failed to send appointment confirmation email: ' . $e->getMessage());
        }

        // Send email notification to lawyer about new booking
        try {
            Mail::to($lawyer->email)->send(new NewAppointmentForLawyer($appointment));
        } catch (\Exception $e) {
            \Log::error('Failed to send lawyer new appointment email: ' . $e->getMessage());
        }

        // Create notification for the lawyer about new appointment
        try {
            $this->notificationService->appointmentCreated($appointment);
        } catch (\Exception $e) {
            \Log::error('Failed to create appointment notification: ' . $e->getMessage());
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

    // Optimize query with selective eager loading and proper indexing
    $query = Appointment::query()
        ->select('appointments.*') // Explicitly select only appointment columns first
        ->with([
            'lawyer:id,first_name,last_name,office_address,reservation_fee', // Only load needed lawyer fields
            'lawyer.specializations:id,name', // Only load needed specialization fields
            'specialization:id,name', // Load the selected specialization for this appointment
            'confirmedSpecialization:id,name' // Load the lawyer-confirmed specialization
        ])
        ->where('user_id', auth()->id());

    // Apply filters and ordering based on type (uses indexes created in migration)
    if ($type === 'upcoming') {
        $query->whereIn('status', ['pending', 'confirmed'])
              ->where(function($q) {
                  // Include appointments with no reschedule status OR accepted reschedule status
                  $q->whereNull('reschedule_status')
                    ->orWhere('reschedule_status', 'accepted');
              })
              ->orderBy('created_at', 'desc');
    } elseif ($type === 'reschedule') {
        $query->where('reschedule_status', 'pending')
              ->whereIn('status', ['pending', 'confirmed'])
              ->orderBy('reschedule_requested_at', 'desc');
    } elseif ($type === 'cancelled') {
        $query->where('status', 'cancelled')
              ->orderBy('updated_at', 'desc');
    } else {
        // Past/Completed tab - only show completed and no_show, NOT cancelled (has its own tab)
        $query->whereIn('status', ['completed', 'no_show'])
              ->orderBy('appointment_date', 'desc')
              ->orderBy('appointment_time', 'desc');
    }

    // Only load reviews for past appointments (completed/cancelled/no_show)
    if ($type !== 'upcoming' && $type !== 'reschedule') {
        $query->with('review:id,appointment_id,rating,comment,is_approved,created_at');
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

            // Log the appointment structure for debugging
            Log::info('Returning appointment data', [
                'has_lawyer' => $appointment->lawyer ? 'yes' : 'no',
                'lawyer_id' => $appointment->lawyer_id,
                'lawyer_data' => $appointment->lawyer ? [
                    'first_name' => $appointment->lawyer->first_name,
                    'last_name' => $appointment->lawyer->last_name,
                    'specializations_count' => $appointment->lawyer->specializations->count()
                ] : null
            ]);

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
        Log::info('Cancel appointment request received', [
            'appointment_id' => $id,
            'user_id' => auth()->id(),
            'request_data' => $request->all()
        ]);

        $request->validate([
            'cancellation_reason' => 'required|string|max:500',
        ]);

        $appointment = Appointment::findOrFail($id);

        Log::info('Appointment found', [
            'appointment_id' => $id,
            'appointment_user_id' => $appointment->user_id,
            'current_user_id' => auth()->id(),
            'appointment_status' => $appointment->status,
            'appointment_date' => $appointment->appointment_date
        ]);

        // Verify user owns this appointment
        if ($appointment->user_id != auth()->id()) {
            Log::warning('Unauthorized cancel attempt', [
                'appointment_id' => $id,
                'appointment_user_id' => $appointment->user_id,
                'appointment_user_id_type' => gettype($appointment->user_id),
                'attempting_user_id' => auth()->id(),
                'attempting_user_id_type' => gettype(auth()->id())
            ]);
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if appointment can be cancelled
        if (!$appointment->canBeCancelled()) {
            Log::warning('Appointment cannot be cancelled', [
                'appointment_id' => $id,
                'status' => $appointment->status,
                'date' => $appointment->appointment_date
            ]);
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

        Log::info('Appointment cancelled successfully', ['appointment_id' => $id]);

        // Create notification for the lawyer about cancellation
        try {
            $appointment->load(['user', 'lawyer']);
            $this->notificationService->appointmentCancelled($appointment, 'client');
        } catch (\Exception $e) {
            Log::error('Failed to create cancellation notification: ' . $e->getMessage());
        }

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

    /**
     * Request to reschedule an appointment (lawyer initiates)
     */
    public function requestReschedule(Request $request, $appointmentId)
    {
        $validated = $request->validate([
            'proposed_date' => 'required|date',
            'proposed_time' => 'required',
            'reason' => 'required|string|max:500',
        ]);

        $user = $request->user();
        $lawyer = Lawyer::where('user_id', $user->id)->first();

        if (!$lawyer) {
            return response()->json(['message' => 'Lawyer profile not found'], 404);
        }

        $appointment = Appointment::where('id', $appointmentId)
            ->where('lawyer_id', $lawyer->id)
            ->whereIn('status', ['confirmed', 'pending'])
            ->first();

        if (!$appointment) {
            return response()->json(['message' => 'Appointment not found or cannot be rescheduled'], 404);
        }

        // Combine proposed date and time into a proper datetime
        $proposedDateTime = Carbon::parse($validated['proposed_date'] . ' ' . $validated['proposed_time'])->format('Y-m-d H:i:s');

        // Store original date if not already stored
        if (!$appointment->original_date) {
            $appointment->original_date = $appointment->appointment_date;
        }

        // Update appointment fields
        $appointment->reschedule_status = 'pending';
        $appointment->reschedule_reason = $validated['reason'];
        $appointment->proposed_date = $proposedDateTime;
        $appointment->reschedule_requested_at = now();
        $appointment->reschedule_requested_by = 'lawyer';
        $updated = $appointment->save();

        if (!$updated) {
            Log::error('Failed to save reschedule data', [
                'appointment_id' => $appointment->id,
            ]);
            return response()->json(['message' => 'Failed to save reschedule request'], 500);
        }

        // Refresh to get the saved data
        $appointment->refresh();

        Log::info('Reschedule requested', [
            'appointment_id' => $appointment->id,
            'original_date' => $appointment->original_date,
            'proposed_date' => $appointment->proposed_date,
            'reason' => $appointment->reschedule_reason,
            'saved_successfully' => true,
        ]);

        // Send email notification to client
        try {
            $appointment->load(['user', 'lawyer']);
            Mail::to($appointment->user->email)->send(new RescheduleRequest($appointment));
            Log::info('Reschedule request email sent', ['appointment_id' => $appointment->id]);
        } catch (\Exception $e) {
            Log::error('Failed to send reschedule request email', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage(),
            ]);
        }

        // Create notification for the client about reschedule request
        try {
            $this->notificationService->rescheduleRequested($appointment);
        } catch (\Exception $e) {
            Log::error('Failed to create reschedule notification: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Reschedule request sent to client',
            'appointment' => $appointment,
        ]);
    }

    /**
     * Client accepts reschedule request
     */
    public function acceptReschedule(Request $request, $appointmentId)
    {
        $user = $request->user();

        $appointment = Appointment::where('id', $appointmentId)
            ->where('user_id', $user->id)
            ->where('reschedule_status', 'pending')
            ->first();

        if (!$appointment) {
            return response()->json(['message' => 'Reschedule request not found'], 404);
        }

        // Update appointment fields
        $appointment->appointment_date = $appointment->proposed_date;
        $appointment->reschedule_status = null; // Clear reschedule status so it shows in Upcoming again
        $appointment->reschedule_responded_at = now();
        $updated = $appointment->save();

        if (!$updated) {
            Log::error('Failed to save reschedule acceptance', [
                'appointment_id' => $appointment->id,
            ]);
            return response()->json(['message' => 'Failed to accept reschedule'], 500);
        }

        // Refresh to get the saved data
        $appointment->refresh();

        Log::info('Reschedule accepted', [
            'appointment_id' => $appointment->id,
            'new_date' => $appointment->appointment_date,
            'reschedule_status' => $appointment->reschedule_status,
        ]);

        // Create notification for the lawyer about reschedule acceptance
        try {
            $appointment->load(['user', 'lawyer']);
            $this->notificationService->rescheduleResponded($appointment, 'accepted');
        } catch (\Exception $e) {
            Log::error('Failed to create reschedule acceptance notification: ' . $e->getMessage());
        }

        // TODO: Send confirmation email to both parties

        return response()->json([
            'message' => 'Reschedule accepted successfully',
            'appointment' => $appointment,
        ]);
    }

    /**
     * Client requests to reschedule an appointment (one-time only)
     */
    public function clientRequestReschedule(Request $request, $appointmentId)
    {
        $validated = $request->validate([
            'proposed_date' => 'required|date',
            'proposed_time' => 'required',
            'reason' => 'required|string|max:500',
        ]);

        $user = $request->user();

        $appointment = Appointment::where('id', $appointmentId)
            ->where('user_id', $user->id)
            ->whereIn('status', ['confirmed', 'pending'])
            ->first();

        if (!$appointment) {
            return response()->json(['message' => 'Appointment not found or cannot be rescheduled'], 404);
        }

        // Check if client has already used their one-time reschedule
        if ($appointment->client_reschedule_used) {
            return response()->json([
                'message' => 'You have already used your one-time reschedule for this appointment'
            ], 422);
        }

        // Check if there's already a pending reschedule request
        if ($appointment->reschedule_status === 'pending') {
            return response()->json([
                'message' => 'There is already a pending reschedule request for this appointment'
            ], 422);
        }

        // Combine proposed date and time into a proper datetime
        $proposedDateTime = Carbon::parse($validated['proposed_date'] . ' ' . $validated['proposed_time'])->format('Y-m-d H:i:s');

        // Store original date if not already stored
        if (!$appointment->original_date) {
            $appointment->original_date = $appointment->appointment_date;
        }

        // Update appointment fields
        $appointment->reschedule_status = 'pending';
        $appointment->reschedule_reason = $validated['reason'];
        $appointment->proposed_date = $proposedDateTime;
        $appointment->reschedule_requested_at = now();
        $appointment->reschedule_requested_by = 'client';
        $appointment->client_reschedule_used = true;
        $updated = $appointment->save();

        if (!$updated) {
            Log::error('Failed to save client reschedule data', [
                'appointment_id' => $appointment->id,
            ]);
            return response()->json(['message' => 'Failed to save reschedule request'], 500);
        }

        // Refresh to get the saved data
        $appointment->refresh();

        Log::info('Client reschedule requested', [
            'appointment_id' => $appointment->id,
            'user_id' => $user->id,
            'original_date' => $appointment->original_date,
            'proposed_date' => $appointment->proposed_date,
            'reason' => $appointment->reschedule_reason,
        ]);

        // Create notification for the lawyer
        try {
            $appointment->load(['user', 'lawyer']);
            // Notify lawyer about client's reschedule request
            $this->notificationService->clientRescheduleRequested($appointment);
        } catch (\Exception $e) {
            Log::error('Failed to create client reschedule notification: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Reschedule request sent successfully. The lawyer will review your request.',
            'appointment' => $appointment,
        ]);
    }

    /**
     * Lawyer responds to client's reschedule request
     */
    public function lawyerRespondToReschedule(Request $request, $appointmentId)
    {
        $validated = $request->validate([
            'response' => 'required|in:accept,decline',
        ]);

        $user = $request->user();
        $lawyer = Lawyer::where('user_id', $user->id)->first();

        if (!$lawyer) {
            return response()->json(['message' => 'Lawyer profile not found'], 404);
        }

        $appointment = Appointment::where('id', $appointmentId)
            ->where('lawyer_id', $lawyer->id)
            ->where('reschedule_status', 'pending')
            ->where('reschedule_requested_by', 'client')
            ->first();

        if (!$appointment) {
            return response()->json(['message' => 'Reschedule request not found'], 404);
        }

        if ($validated['response'] === 'accept') {
            // Accept the reschedule - update appointment date/time
            $proposedDateTime = Carbon::parse($appointment->proposed_date);
            
            $appointment->appointment_date = $proposedDateTime->format('Y-m-d');
            $appointment->appointment_time = $proposedDateTime->format('H:i:s');
            $appointment->reschedule_status = 'accepted';
            $appointment->reschedule_responded_at = now();
            $appointment->save();

            // Create notification for the client
            try {
                $appointment->load(['user', 'lawyer']);
                $this->notificationService->rescheduleResponded($appointment, 'accepted');
            } catch (\Exception $e) {
                Log::error('Failed to create reschedule accepted notification: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Reschedule request accepted',
                'appointment' => $appointment,
            ]);
        } else {
            // Decline the reschedule - appointment stays as is
            $appointment->reschedule_status = 'declined';
            $appointment->reschedule_responded_at = now();
            $appointment->save();

            // Create notification for the client
            try {
                $appointment->load(['user', 'lawyer']);
                $this->notificationService->rescheduleResponded($appointment, 'declined');
            } catch (\Exception $e) {
                Log::error('Failed to create reschedule declined notification: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Reschedule request declined. The original appointment remains unchanged.',
                'appointment' => $appointment,
            ]);
        }
    }

    /**
     * Client declines reschedule request - appointment is cancelled
     */
    public function declineReschedule(Request $request, $appointmentId)
    {
        $user = $request->user();

        $appointment = Appointment::where('id', $appointmentId)
            ->where('user_id', $user->id)
            ->where('reschedule_status', 'pending')
            ->first();

        if (!$appointment) {
            return response()->json(['message' => 'Reschedule request not found'], 404);
        }

        // Update appointment fields
        $appointment->reschedule_status = 'declined';
        $appointment->reschedule_responded_at = now();
        $appointment->status = 'cancelled';
        $updated = $appointment->save();

        if (!$updated) {
            Log::error('Failed to save reschedule decline', [
                'appointment_id' => $appointment->id,
            ]);
            return response()->json(['message' => 'Failed to decline reschedule'], 500);
        }

        // Refresh to get the saved data
        $appointment->refresh();

        Log::info('Reschedule declined, appointment cancelled', [
            'appointment_id' => $appointment->id,
            'reschedule_status' => $appointment->reschedule_status,
        ]);

        // Create notification for the lawyer about reschedule decline
        try {
            $appointment->load(['user', 'lawyer']);
            $this->notificationService->rescheduleResponded($appointment, 'declined');
        } catch (\Exception $e) {
            Log::error('Failed to create reschedule decline notification: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Appointment cancelled successfully',
            'appointment' => $appointment,
        ]);
    }

    /**
     * Bulk reschedule appointments for a specific date (lawyer initiates)
     */
    public function bulkReschedule(Request $request)
    {
        $validated = $request->validate([
            'original_date' => 'required|date',
            'proposed_date' => 'required|date',
            'proposed_time' => 'required',
            'reason' => 'required|string|max:500',
            'appointment_ids' => 'required|array|min:1',
            'appointment_ids.*' => 'required|integer|exists:appointments,id',
        ]);

        $user = $request->user();
        $lawyer = Lawyer::where('user_id', $user->id)->first();

        if (!$lawyer) {
            return response()->json(['message' => 'Lawyer profile not found'], 404);
        }

        // Get all appointments for the lawyer that match the criteria
        $appointments = Appointment::whereIn('id', $validated['appointment_ids'])
            ->where('lawyer_id', $lawyer->id)
            ->whereIn('status', ['confirmed', 'pending'])
            ->get();

        if ($appointments->isEmpty()) {
            return response()->json(['message' => 'No valid appointments found to reschedule'], 404);
        }

        $rescheduledCount = 0;
        $failedAppointments = [];

        foreach ($appointments as $appointment) {
            try {
                // Combine proposed date and time into a proper datetime
                $proposedDateTime = Carbon::parse($validated['proposed_date'] . ' ' . $validated['proposed_time'])->format('Y-m-d H:i:s');

                // Build update data
                $updateData = [
                    'reschedule_status' => 'pending',
                    'reschedule_reason' => $validated['reason'],
                    'proposed_date' => $proposedDateTime,
                    'reschedule_requested_at' => now(),
                ];

                // Store original date if not already stored
                if (!$appointment->original_date) {
                    $updateData['original_date'] = $appointment->appointment_date;
                }

                $appointment->update($updateData);

                $rescheduledCount++;

                Log::info('Bulk reschedule - appointment updated', [
                    'appointment_id' => $appointment->id,
                    'original_date' => $appointment->original_date,
                    'proposed_date' => $proposedDateTime,
                ]);

                // Send email notification to client
                try {
                    $appointment->load(['user', 'lawyer']);
                    Mail::to($appointment->user->email)->send(new RescheduleRequest($appointment));
                    Log::info('Bulk reschedule - email sent', ['appointment_id' => $appointment->id]);
                } catch (\Exception $emailError) {
                    Log::error('Failed to send bulk reschedule email', [
                        'appointment_id' => $appointment->id,
                        'error' => $emailError->getMessage(),
                    ]);
                }

            } catch (\Exception $e) {
                Log::error('Failed to reschedule appointment in bulk', [
                    'appointment_id' => $appointment->id,
                    'error' => $e->getMessage(),
                ]);
                $failedAppointments[] = $appointment->id;
            }
        }

        return response()->json([
            'message' => "Successfully sent reschedule requests to {$rescheduledCount} client(s)",
            'rescheduled_count' => $rescheduledCount,
            'failed_count' => count($failedAppointments),
            'failed_appointments' => $failedAppointments,
        ]);
    }
}