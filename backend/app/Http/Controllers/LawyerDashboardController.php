<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Appointment;
use App\Models\Review;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Services\GoogleCalendarService;

class LawyerDashboardController extends Controller
{
    /**
     * Get lawyer's dashboard overview
     */
    public function index(Request $request)
    {
        $lawyer = $request->user()->lawyer;

        if (!$lawyer) {
            return response()->json([
                'error' => 'Lawyer profile not found'
            ], 404);
        }

        $stats = [
            'active_cases_count' => DB::table('cases')
                ->where('lawyer_id', $lawyer->id)
                ->where('status', 'active')
                ->count(),

            'upcoming_count' => $lawyer->appointments()
                ->where('status', 'confirmed')
                ->where('appointment_date', '>=', now()->toDateString())
                ->count(),

            'completed_count' => $lawyer->appointments()
                ->where('status', 'completed')
                ->count(),

            // Use net_amount from lawyer_earnings table (after platform fees)
            'total_earnings' => $lawyer->earnings()
                ->where('status', 'completed')
                ->sum('net_amount'),

            'this_month_earnings' => $lawyer->earnings()
                ->where('status', 'completed')
                ->whereMonth('completed_at', now()->month)
                ->whereYear('completed_at', now()->year)
                ->sum('net_amount'),

            // Review stats
            'average_rating' => $lawyer->rating ?? 0,
            'total_reviews' => $lawyer->total_reviews ?? 0,
        ];

        // Get recent reviews (last 5)
        $recentReviews = Review::with('user:id,name')
            ->where('lawyer_id', $lawyer->id)
            ->where('is_approved', true)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($review) {
                return [
                    'id' => $review->id,
                    'rating' => $review->rating,
                    'comment' => $review->comment,
                    'client_name' => $review->user->name,
                    'created_at' => $review->created_at->format('M d, Y'),
                ];
            });

        // Get today's appointments
        $todayAppointments = $lawyer->appointments()
            ->with('user:id,name,email,phone,profile_picture')
            ->where('appointment_date', now()->toDateString())
            ->whereIn('status', ['confirmed', 'pending'])
            ->orderBy('appointment_time', 'asc')
            ->get()
            ->map(function ($apt) {
                return [
                    'id' => $apt->id,
                    'client_name' => $apt->user->name ?? 'Unknown',
                    'client_photo' => $apt->user->profile_picture ?? null,
                    'start_time' => $apt->appointment_time,
                    'end_time' => null,
                    'status' => $apt->status,
                    'consultation_type' => $apt->consultation_type ?? 'consultation',
                ];
            });

        // Get recent booking activity (last 10 appointments by created_at)
        $recentActivity = $lawyer->appointments()
            ->with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($apt) {
                $action = match($apt->status) {
                    'pending' => 'New booking request',
                    'confirmed' => 'Booking confirmed',
                    'completed' => 'Session completed',
                    'cancelled' => 'Booking cancelled',
                    'declined' => 'Booking declined',
                    default => 'Booking updated'
                };
                
                return [
                    'id' => $apt->id,
                    'action' => $action,
                    'client_name' => $apt->user->name ?? 'Unknown',
                    'status' => $apt->status,
                    'appointment_date' => $apt->appointment_date,
                    'created_at' => $apt->created_at->diffForHumans(),
                    'amount' => $apt->consultation_fee ?? 0,
                ];
            });

        return response()->json([
            'lawyer' => $lawyer,
            'stats' => $stats,
            'recent_reviews' => $recentReviews,
            'today_appointments' => $todayAppointments,
            'recent_activity' => $recentActivity,
        ]);
    }

    /**
     * Get all appointments for the lawyer
     */
    public function appointments(Request $request)
    {
        $lawyer = $request->user()->lawyer;
        $status = $request->query('status');

        $query = $lawyer->appointments()
            ->with([
                'user:id,name,email,phone',
                'specialization:id,name', // Load the client-selected specialization
                'confirmedSpecialization:id,name' // Load the lawyer-confirmed specialization
            ])
            ->orderBy('appointments.created_at', 'desc'); // Sort by booking time only (most recent bookings first)

        if ($status === 'reschedule') {
            // Filter by pending reschedule status
            $query->where('reschedule_status', 'pending')
                  ->whereIn('status', ['pending', 'confirmed']);
        } elseif ($status) {
            $query->where('status', $status);
        }

        $appointments = $query->get();

        // Add reservation_fee to each appointment
        $appointments = $appointments->map(function ($appointment) use ($lawyer) {
            $appointment->reservation_fee = $lawyer->reservation_fee ?? 100.00;
            return $appointment;
        });

        return response()->json($appointments);
    }

    /**
     * Accept/Confirm an appointment
     */
    public function acceptAppointment(Request $request, $appointmentId)
    {
        $lawyer = $request->user()->lawyer;

        $appointment = Appointment::where('id', $appointmentId)
            ->where('lawyer_id', $lawyer->id)
            ->where('status', 'pending')
            ->first();

        if (!$appointment) {
            return response()->json([
                'error' => 'Appointment not found or already processed'
            ], 404);
        }

        $appointment->status = 'confirmed';
        $appointment->save();

        // Auto-sync to Google Calendar if connected and not already synced
        if ($lawyer->google_calendar_connected && !$appointment->google_event_id) {
            try {
                $googleCalendarService = app(GoogleCalendarService::class);
                $appointment->load('user'); // Load user relationship for event creation
                $eventId = $googleCalendarService->createAppointmentEvent($lawyer, $appointment);

                if ($eventId) {
                    $appointment->update(['google_event_id' => $eventId]);
                    Log::info('Appointment auto-synced to Google Calendar on confirmation', [
                        'appointment_id' => $appointment->id,
                        'event_id' => $eventId
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Failed to auto-sync appointment to Google Calendar', [
                    'appointment_id' => $appointment->id,
                    'error' => $e->getMessage()
                ]);
                // Don't fail the confirmation if sync fails
            }
        }

        return response()->json([
            'message' => 'Appointment confirmed successfully',
            'appointment' => $appointment->load('user:id,name,email,phone')
        ]);
    }

    /**
     * Decline an appointment
     */
    public function declineAppointment(Request $request, $appointmentId)
    {
        $request->validate([
            'reason' => 'required|string|max:500'
        ]);

        $lawyer = $request->user()->lawyer;

        // Allow declining appointments that are pending or confirmed
        $appointment = Appointment::where('id', $appointmentId)
            ->where('lawyer_id', $lawyer->id)
            ->whereIn('status', ['pending', 'confirmed'])
            ->first();

        if (!$appointment) {
            return response()->json([
                'error' => 'Appointment not found or already processed'
            ], 404);
        }

        $appointment->status = 'cancelled';
        $appointment->cancelled_by = $request->user()->id; // Set to the user ID of the lawyer
        $appointment->cancellation_reason = $request->reason;
        $appointment->cancelled_at = now();
        $appointment->save();

        return response()->json([
            'message' => 'Appointment declined successfully',
            'appointment' => $appointment
        ]);
    }

    /**
     * Mark appointment as completed
     */
    public function completeAppointment(Request $request, $appointmentId)
    {
        $lawyer = $request->user()->lawyer;

        $appointment = Appointment::where('id', $appointmentId)
            ->where('lawyer_id', $lawyer->id)
            ->where('status', 'confirmed')
            ->first();

        if (!$appointment) {
            return response()->json([
                'error' => 'Appointment not found or cannot be completed'
            ], 404);
        }

        $appointment->status = 'completed';
        $appointment->save();

        return response()->json([
            'message' => 'Appointment marked as completed',
            'appointment' => $appointment
        ]);
    }

    /**
     * Add lawyer notes to appointment
     */
    public function addNotes(Request $request, $appointmentId)
    {
        $request->validate([
            'notes' => 'required|string|max:2000'
        ]);

        $lawyer = $request->user()->lawyer;

        $appointment = Appointment::where('id', $appointmentId)
            ->where('lawyer_id', $lawyer->id)
            ->first();

        if (!$appointment) {
            return response()->json([
                'error' => 'Appointment not found'
            ], 404);
        }

        $appointment->lawyer_notes = $request->notes;
        $appointment->save();

        return response()->json([
            'message' => 'Notes saved successfully',
            'appointment' => $appointment
        ]);
    }

    /**
     * Confirm/Set the specialization for an appointment
     */
    public function confirmSpecialization(Request $request, $appointmentId)
    {
        $request->validate([
            'specialization_id' => 'required|exists:specializations,id'
        ]);

        $lawyer = $request->user()->lawyer;

        $appointment = Appointment::where('id', $appointmentId)
            ->where('lawyer_id', $lawyer->id)
            ->whereIn('status', ['pending', 'confirmed'])
            ->first();

        if (!$appointment) {
            return response()->json([
                'error' => 'Appointment not found or cannot be updated'
            ], 404);
        }

        // Verify the lawyer has this specialization
        $hasSpecialization = $lawyer->specializations()
            ->where('specializations.id', $request->specialization_id)
            ->exists();

        if (!$hasSpecialization) {
            return response()->json([
                'error' => 'You do not have this specialization'
            ], 403);
        }

        $appointment->confirmed_specialization_id = $request->specialization_id;
        $appointment->specialization_confirmed_at = now();
        $appointment->save();

        // Load the confirmed specialization relationship
        $appointment->load('confirmedSpecialization:id,name');

        return response()->json([
            'message' => 'Case type confirmed successfully',
            'appointment' => $appointment
        ]);
    }

    /**
     * Get earnings summary
     */
    public function earnings(Request $request)
    {
        $lawyer = $request->user()->lawyer;

        $earnings = [
            'total' => $lawyer->appointments()
                ->where('payment_status', 'paid')
                ->whereIn('status', ['confirmed', 'completed'])
                ->sum('consultation_fee'),
                
            'this_month' => $lawyer->appointments()
                ->where('payment_status', 'paid')
                ->whereIn('status', ['confirmed', 'completed'])
                ->whereMonth('appointment_date', now()->month)
                ->whereYear('appointment_date', now()->year)
                ->sum('consultation_fee'),
                
            'last_month' => $lawyer->appointments()
                ->where('payment_status', 'paid')
                ->whereIn('status', ['confirmed', 'completed'])
                ->whereMonth('appointment_date', now()->subMonth()->month)
                ->whereYear('appointment_date', now()->subMonth()->year)
                ->sum('consultation_fee'),
                
            'monthly_breakdown' => $lawyer->appointments()
                ->select(
                    DB::raw('YEAR(appointment_date) as year'),
                    DB::raw('MONTH(appointment_date) as month'),
                    DB::raw('SUM(consultation_fee) as total')
                )
                ->where('payment_status', 'paid')
                ->whereIn('status', ['confirmed', 'completed'])
                ->groupBy(DB::raw('YEAR(appointment_date)'), DB::raw('MONTH(appointment_date)'))
                ->orderBy('year', 'desc')
                ->orderBy('month', 'desc')
                ->limit(12)
                ->get()
        ];

        return response()->json($earnings);
    }

    /**
     * Toggle lawyer availability
     */
    public function toggleAvailability(Request $request)
    {
        $lawyer = $request->user()->lawyer;
        $lawyer->is_available = !$lawyer->is_available;
        $lawyer->save();

        // Invalidate cached lawyers list so client search reflects availability immediately
        \Cache::forget('lawyers_list_v1');

        return response()->json([
            'message' => 'Availability updated',
            'is_available' => $lawyer->is_available
        ]);
    }

    /**
     * Get lawyer profile
     */
    public function getProfile(Request $request)
    {
        $lawyer = $request->user()->lawyer;

        if (!$lawyer) {
            return response()->json([
                'error' => 'Lawyer profile not found'
            ], 404);
        }

        // Load specializations without circular references
        $lawyer->load('specializations:id,name,description');

        // Return only necessary fields to avoid circular reference issues
        return response()->json([
            'id' => $lawyer->id,
            'user_id' => $lawyer->user_id,
            'first_name' => $lawyer->first_name,
            'last_name' => $lawyer->last_name,
            'full_name' => $lawyer->full_name,
            'bio' => $lawyer->bio,
            'license_number' => $lawyer->license_number,
            'years_experience' => $lawyer->years_experience,
            'hourly_rate' => $lawyer->hourly_rate,
            'reservation_fee' => $lawyer->reservation_fee ?? 100.00,
            'office_address' => $lawyer->office_address,
            'office_latitude' => $lawyer->office_latitude,
            'office_longitude' => $lawyer->office_longitude,
            'office_phone' => $lawyer->office_phone,
            'office_hours' => $lawyer->office_hours,
            'profile_photo' => $lawyer->profile_photo,
            'profile_photo_url' => $lawyer->profile_photo_url,
            'status' => $lawyer->status,
            'rating' => $lawyer->rating,
            'total_reviews' => $lawyer->total_reviews,
            'is_available' => $lawyer->is_available,
            'verification_status' => $lawyer->verification_status,
            'verified_at' => $lawyer->verified_at,
            'verification_notes' => $lawyer->verification_notes,
            'specializations' => $lawyer->specializations,
            // Payment info for direct client payments
            'gcash_number' => $lawyer->gcash_number,
            'gcash_account_name' => $lawyer->gcash_account_name,
            'gcash_qr_code' => $lawyer->gcash_qr_code,
            'gcash_qr_url' => $lawyer->gcash_qr_url,
            'bank_name' => $lawyer->bank_name,
            'bank_account_number' => $lawyer->bank_account_number,
            'bank_account_name' => $lawyer->bank_account_name,
            'preferred_payout_method' => $lawyer->preferred_payout_method,
            'created_at' => $lawyer->created_at,
            'updated_at' => $lawyer->updated_at,
        ]);
    }

    /**
     * Update lawyer profile
     */
    public function updateProfile(Request $request)
    {
        $lawyer = $request->user()->lawyer;

        if (!$lawyer) {
            return response()->json([
                'error' => 'Lawyer profile not found'
            ], 404);
        }

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'bio' => 'required|string|min:50',
            'license_number' => 'required|string|unique:lawyers,license_number,' . $lawyer->id,
            'years_experience' => 'required|integer|min:0',
            'hourly_rate' => 'required|numeric|min:0',
            'reservation_fee' => 'nullable|numeric|min:0',
            'office_address' => 'required|string',
            'office_latitude' => 'nullable|numeric|between:-90,90',
            'office_longitude' => 'nullable|numeric|between:-180,180',
            'office_phone' => 'nullable|string',
            'office_hours' => 'nullable|string',
            'is_available' => 'boolean',
            'specialization_ids' => 'required|array|min:1',
            'specialization_ids.*' => 'exists:specializations,id',
            'profile_photo' => 'nullable|image|mimes:jpeg,jpg,png,gif|max:10240', // 10MB max
        ]);

        // Handle profile photo upload
        if ($request->hasFile('profile_photo')) {
            // Delete old profile photo if exists
            if ($lawyer->profile_photo) {
                Storage::disk(env('FILESYSTEM_DISK', 'public'))->delete($lawyer->profile_photo);
            }

            // Store new profile photo
            $path = $request->file('profile_photo')->store('lawyers/' . $lawyer->id, env('FILESYSTEM_DISK', 'public'));
            $lawyer->profile_photo = $path;
        }

        // Update lawyer details
        $lawyer->update([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'bio' => $validated['bio'],
            'license_number' => $validated['license_number'],
            'years_experience' => $validated['years_experience'],
            'hourly_rate' => $validated['hourly_rate'],
            'reservation_fee' => $validated['reservation_fee'] ?? 100.00,
            'office_address' => $validated['office_address'],
            'office_latitude' => $validated['office_latitude'] ?? null,
            'office_longitude' => $validated['office_longitude'] ?? null,
            'office_phone' => $validated['office_phone'],
            'office_hours' => $validated['office_hours'] ?? null,
            'is_available' => $validated['is_available'] ?? true,
        ]);

        // Also sync the name on the linked user record so admin / users list shows the updated name
        try {
            if ($lawyer->user) {
                $fullName = trim(($validated['first_name'] ?? $lawyer->first_name) . ' ' . ($validated['last_name'] ?? $lawyer->last_name));
                if ($lawyer->user->name !== $fullName) {
                    $lawyer->user->name = $fullName;
                    $lawyer->user->save();
                }
            }
        } catch (\Exception $e) {
            // Do not fail the profile update if user sync fails — log and continue
            \Log::warning('Failed to sync user.name with lawyer profile', ['lawyer_id' => $lawyer->id, 'error' => $e->getMessage()]);
        }

        // Sync specializations
        $lawyer->specializations()->sync($validated['specialization_ids']);

        return response()->json([
            'message' => 'Profile updated successfully',
            'lawyer' => $lawyer->load('specializations')
        ]);
    }

    /**
     * Upload lawyer profile photo
     */
    public function uploadProfilePhoto(Request $request)
    {
        $lawyer = $request->user()->lawyer;

        if (!$lawyer) {
            return response()->json([
                'error' => 'Lawyer profile not found'
            ], 404);
        }

        // Debug: Check if file is present
        if (!$request->hasFile('profile_photo')) {
            return response()->json([
                'message' => 'No file received',
                'debug' => [
                    'has_file' => false,
                    'files' => $request->allFiles(),
                    'content_type' => $request->header('Content-Type')
                ]
            ], 422);
        }

        // Validate (max 10MB)
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'profile_photo' => 'required|image|mimes:jpeg,jpg,png,gif|max:10240', // 10MB max
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Delete old profile photo if exists
        if ($lawyer->profile_photo) {
            Storage::disk(env('FILESYSTEM_DISK', 'public'))->delete($lawyer->profile_photo);
        }

        // Store new profile photo
        $path = $request->file('profile_photo')->store('lawyers/' . $lawyer->id, env('FILESYSTEM_DISK', 'public'));

        $lawyer->profile_photo = $path;
        $lawyer->save();

        // Refresh the lawyer to get the appended attributes
        $lawyer->refresh();

        return response()->json([
            'message' => 'Profile photo uploaded successfully',
            'lawyer' => $lawyer
        ]);
    }

    /**
     * Delete lawyer profile photo
     */
    public function deleteProfilePhoto(Request $request)
    {
        $lawyer = $request->user()->lawyer;

        if (!$lawyer) {
            return response()->json([
                'error' => 'Lawyer profile not found'
            ], 404);
        }

        if ($lawyer->profile_photo) {
            Storage::disk(env('FILESYSTEM_DISK', 'public'))->delete($lawyer->profile_photo);
            $lawyer->profile_photo = null;
            $lawyer->save();
        }

        return response()->json([
            'message' => 'Profile photo deleted successfully',
            'lawyer' => $lawyer
        ]);
    }

    /**
     * Get calendar availability for a specific month
     */
    public function getCalendarAvailability(Request $request)
    {
        $lawyer = $request->user()->lawyer;

        if (!$lawyer) {
            return response()->json(['error' => 'Lawyer profile not found'], 404);
        }

        $year = $request->query('year', date('Y'));
        $month = $request->query('month', date('m'));

        // Get all unavailable dates for the specified month
        $unavailableDates = DB::table('lawyer_unavailable_dates')
            ->where('lawyer_id', $lawyer->id)
            ->whereYear('unavailable_date', $year)
            ->whereMonth('unavailable_date', $month)
            ->get(['unavailable_date as date'])
            ->map(function($record) {
                // Ensure we return only the date part in YYYY-MM-DD format
                $date = $record->date;
                if ($date instanceof \DateTime) {
                    $date = $date->format('Y-m-d');
                } else {
                    // If it's a string, extract just the date part
                    $date = substr($date, 0, 10);
                }
                return [
                    'date' => $date,
                    'is_available' => false
                ];
            });

        return response()->json($unavailableDates);
    }

    /**
     * Set availability for a specific date
     */
    public function setDateAvailability(Request $request)
    {
        $lawyer = $request->user()->lawyer;

        if (!$lawyer) {
            return response()->json(['error' => 'Lawyer profile not found'], 404);
        }

        $validated = $request->validate([
            'date' => 'required|date_format:Y-m-d|after_or_equal:today',
            'is_available' => 'required|boolean',
        ]);

        // Ensure date is in YYYY-MM-DD format without timezone conversion
        $dateString = $validated['date'];

        if ($validated['is_available']) {
            // If marking as available, delete the unavailable date record
            DB::table('lawyer_unavailable_dates')
                ->where('lawyer_id', $lawyer->id)
                ->where('unavailable_date', $dateString)
                ->delete();
        } else {
            // If marking as unavailable, insert/update the record
            DB::table('lawyer_unavailable_dates')->updateOrInsert(
                [
                    'lawyer_id' => $lawyer->id,
                    'unavailable_date' => $dateString,
                ],
                [
                    'reason' => 'Manually blocked via calendar',
                ]
            );
        }

        return response()->json([
            'message' => 'Availability updated successfully',
            'date' => $validated['date'],
            'is_available' => $validated['is_available'],
        ]);
    }

    /**
     * Get lawyer's appointments in calendar format
     * Returns appointments directly from database (not from Google Calendar)
     */
    public function getCalendarAppointments(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $lawyer = $request->user()->lawyer;

        if (!$lawyer) {
            return response()->json([
                'error' => 'Lawyer profile not found'
            ], 404);
        }

        // Get appointments within the date range (include cancelled)
        $appointments = $lawyer->appointments()
            ->with('user')
            ->where('appointment_date', '>=', $request->start_date)
            ->where('appointment_date', '<=', $request->end_date)
            ->whereIn('status', ['pending', 'confirmed', 'completed', 'cancelled'])
            ->orderBy('appointment_date')
            ->orderBy('appointment_time')
            ->get();

        // Format appointments as calendar events
        $events = $appointments->map(function ($appointment) {
            // Combine date and time for start datetime
            // Extract date only from appointment_date (which may contain datetime)
            $dateOnly = \Carbon\Carbon::parse($appointment->appointment_date)->format('Y-m-d');

            // Extract time only from appointment_time (remove microseconds if present)
            $timeOnly = substr($appointment->appointment_time, 0, 8); // Get HH:MM:SS

            // Parse datetime in Philippine timezone (Asia/Manila)
            $startDateTime = \Carbon\Carbon::parse($dateOnly . ' ' . $timeOnly, 'Asia/Manila');

            // Ensure duration_minutes is a valid integer
            $durationMinutes = (int)($appointment->duration_minutes ?? 60);
            if ($durationMinutes <= 0 || $durationMinutes > 480) {
                $durationMinutes = 60; // Default to 60 minutes if invalid
            }

            $endDateTime = $startDateTime->copy()->addMinutes($durationMinutes);

            // Determine color based on status
            $colorMap = [
                'pending' => '5',     // Yellow
                'confirmed' => '10',  // Emerald Green
                'completed' => '8',   // Teal
                'cancelled' => '4',   // Red
            ];

            return [
                'id' => 'apt_' . $appointment->id,
                'summary' => 'Consultation - ' . $appointment->user->name,
                'description' => "Client: {$appointment->user->name}\nEmail: {$appointment->user->email}\nMeeting Type: {$appointment->meeting_type}\nStatus: {$appointment->status}\n\nClient Notes:\n{$appointment->client_notes}",
                'start' => $startDateTime->toIso8601String(),
                'end' => $endDateTime->toIso8601String(),
                'color' => $colorMap[$appointment->status] ?? '10',
                'is_all_day' => false,
                'appointment_id' => $appointment->id,
                'status' => $appointment->status,
                'payment_status' => $appointment->payment_status,
            ];
        });

        Log::info('Calendar appointments fetched from database', [
            'lawyer_id' => $lawyer->id,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'count' => $events->count()
        ]);

        return response()->json([
            'events' => $events
        ]);
    }

    /**
     * Update lawyer's payment information (GCash/Bank details)
     */
    public function updatePaymentInfo(Request $request)
    {
        try {
            $lawyer = $request->user()->lawyer;

            if (!$lawyer) {
                return response()->json(['message' => 'Lawyer profile not found'], 404);
            }

            $request->validate([
                'gcash_number' => 'nullable|string|max:20',
                'gcash_account_name' => 'nullable|string|max:255',
                'bank_name' => 'nullable|string|max:255',
                'bank_account_number' => 'nullable|string|max:50',
                'bank_account_name' => 'nullable|string|max:255',
                'preferred_payout_method' => 'nullable|in:gcash,bank',
            ]);

            $lawyer->update([
                'gcash_number' => $request->gcash_number,
                'gcash_account_name' => $request->gcash_account_name,
                'bank_name' => $request->bank_name,
                'bank_account_number' => $request->bank_account_number,
                'bank_account_name' => $request->bank_account_name,
                'preferred_payout_method' => $request->preferred_payout_method ?? 'gcash',
            ]);

            Log::info('Lawyer payment info updated', ['lawyer_id' => $lawyer->id]);

            return response()->json([
                'message' => 'Payment information updated successfully',
                'payment_info' => [
                    'gcash_number' => $lawyer->gcash_number,
                    'gcash_account_name' => $lawyer->gcash_account_name,
                    'gcash_qr_code' => $lawyer->gcash_qr_code,
                    'gcash_qr_url' => $lawyer->gcash_qr_url,
                    'bank_name' => $lawyer->bank_name,
                    'bank_account_number' => $lawyer->bank_account_number,
                    'bank_account_name' => $lawyer->bank_account_name,
                    'preferred_payout_method' => $lawyer->preferred_payout_method,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating payment info: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to update payment information'], 500);
        }
    }

    /**
     * Upload GCash QR code
     */
    public function uploadGcashQr(Request $request)
    {
        try {
            $lawyer = $request->user()->lawyer;

            if (!$lawyer) {
                return response()->json(['message' => 'Lawyer profile not found'], 404);
            }

            $request->validate([
                'gcash_qr' => 'required|image|mimes:jpeg,png,jpg|max:2048', // 2MB max
            ]);

            // Delete old QR if exists
            if ($lawyer->gcash_qr_code) {
                Storage::disk(env('FILESYSTEM_DISK', 'public'))->delete($lawyer->gcash_qr_code);
            }

            // Store new QR
            $file = $request->file('gcash_qr');
            $filename = 'gcash_qr_' . $lawyer->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('gcash_qr_codes', $filename, env('FILESYSTEM_DISK', 'public'));

            $lawyer->update(['gcash_qr_code' => $path]);

            // Refresh to get appended attributes
            $lawyer->refresh();

            Log::info('GCash QR uploaded', ['lawyer_id' => $lawyer->id]);

            return response()->json([
                'message' => 'GCash QR code uploaded successfully',
                'gcash_qr_url' => $lawyer->gcash_qr_url,
            ]);
        } catch (\Exception $e) {
            Log::error('Error uploading GCash QR: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to upload GCash QR code'], 500);
        }
    }

    /**
     * Delete GCash QR code
     */
    public function deleteGcashQr(Request $request)
    {
        try {
            $lawyer = $request->user()->lawyer;

            if (!$lawyer) {
                return response()->json(['message' => 'Lawyer profile not found'], 404);
            }

            if ($lawyer->gcash_qr_code) {
                Storage::disk(env('FILESYSTEM_DISK', 'public'))->delete($lawyer->gcash_qr_code);
                $lawyer->update(['gcash_qr_code' => null]);
            }

            return response()->json(['message' => 'GCash QR code deleted successfully']);
        } catch (\Exception $e) {
            Log::error('Error deleting GCash QR: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to delete GCash QR code'], 500);
        }
    }

    /**
     * Get transaction history (completed appointments with payment info)
     */
    public function getTransactionHistory(Request $request)
    {
        try {
            $lawyer = $request->user()->lawyer;

            if (!$lawyer) {
                return response()->json(['message' => 'Lawyer profile not found'], 404);
            }

            $perPage = $request->get('per_page', 20);

            // Get completed appointments with payment confirmed
            $transactions = $lawyer->appointments()
                ->with('user:id,name,email')
                ->whereIn('status', ['completed', 'confirmed'])
                ->orderBy('appointment_date', 'desc')
                ->paginate($perPage);

            $formattedTransactions = $transactions->getCollection()->map(function ($appointment) {
                return [
                    'id' => $appointment->id,
                    'appointment_id' => $appointment->id,
                    'client_name' => $appointment->user->name ?? 'Unknown',
                    'client_email' => $appointment->user->email ?? '',
                    'appointment_date' => $appointment->appointment_date->format('Y-m-d'),
                    'appointment_time' => $appointment->appointment_time,
                    'consultation_fee' => $appointment->consultation_fee,
                    'reservation_fee' => $appointment->lawyer->reservation_fee ?? 100,
                    'payment_method_used' => $appointment->payment_method_used ?? null,
                    'payment_status' => $appointment->payment_status,
                    'payment_confirmed' => (bool) $appointment->payment_confirmed,
                    'payment_confirmed_at' => $appointment->payment_confirmed_at 
                        ? $appointment->payment_confirmed_at->toISOString() 
                        : null,
                    'status' => $appointment->status,
                    'completed_at' => $appointment->updated_at->toISOString(),
                ];
            });

            // Calculate summary stats
            $summary = [
                'total_appointments' => $lawyer->appointments()->count(),
                'confirmed_payments' => $lawyer->appointments()
                    ->where('payment_confirmed', true)
                    ->count(),
                'total_completed' => $lawyer->appointments()->where('status', 'completed')->count(),
                'pending_confirmation' => $lawyer->appointments()
                    ->whereNotNull('payment_proof')
                    ->where('payment_confirmed', false)
                    ->whereIn('status', ['pending', 'confirmed'])
                    ->count(),
            ];

            return response()->json([
                'transactions' => $formattedTransactions,
                'summary' => $summary,
                'pagination' => [
                    'current_page' => $transactions->currentPage(),
                    'last_page' => $transactions->lastPage(),
                    'per_page' => $transactions->perPage(),
                    'total' => $transactions->total(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting transaction history: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to get transaction history'], 500);
        }
    }
}