<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Appointment;
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
            'pending_count' => $lawyer->appointments()
                ->where('status', 'pending')
                ->count(),
            
            'upcoming_count' => $lawyer->appointments()
                ->where('status', 'confirmed')
                ->where('appointment_date', '>=', now()->toDateString())
                ->count(),
            
            'completed_count' => $lawyer->appointments()
                ->where('status', 'completed')
                ->count(),
            
            'total_earnings' => $lawyer->appointments()
                ->where('payment_status', 'paid')
                ->whereIn('status', ['confirmed', 'completed'])
                ->sum('consultation_fee'),
            
            'this_month_earnings' => $lawyer->appointments()
                ->where('payment_status', 'paid')
                ->whereIn('status', ['confirmed', 'completed'])
                ->whereMonth('appointment_date', now()->month)
                ->whereYear('appointment_date', now()->year)
                ->sum('consultation_fee'),
        ];

        return response()->json([
            'lawyer' => $lawyer,
            'stats' => $stats
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
            ->with('user:id,name,email,phone')
            ->orderBy('appointments.created_at', 'desc'); // Sort by booking time only (most recent bookings first)

        if ($status) {
            $query->where('status', $status);
        }

        $appointments = $query->get();

        // Debug log to check Google Calendar sync status
        foreach ($appointments as $appointment) {
            Log::info('Appointment Google Calendar sync status', [
                'appointment_id' => $appointment->id,
                'client_name' => $appointment->user->name,
                'date' => $appointment->appointment_date,
                'time' => $appointment->appointment_time,
                'status' => $appointment->status,
                'has_google_event_id' => !empty($appointment->google_event_id),
                'google_event_id' => $appointment->google_event_id
            ]);
        }

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

        $appointment = Appointment::where('id', $appointmentId)
            ->where('lawyer_id', $lawyer->id)
            ->where('status', 'pending')
            ->first();

        if (!$appointment) {
            return response()->json([
                'error' => 'Appointment not found or already processed'
            ], 404);
        }

        $appointment->status = 'cancelled';
        $appointment->cancelled_by = 'lawyer';
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
            'office_address' => $lawyer->office_address,
            'office_latitude' => $lawyer->office_latitude,
            'office_longitude' => $lawyer->office_longitude,
            'office_phone' => $lawyer->office_phone,
            'office_hours' => $lawyer->office_hours,
            'profile_photo' => $lawyer->profile_photo,
            'status' => $lawyer->status,
            'rating' => $lawyer->rating,
            'total_reviews' => $lawyer->total_reviews,
            'is_available' => $lawyer->is_available,
            'specializations' => $lawyer->specializations,
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
            'office_address' => 'required|string',
            'office_latitude' => 'nullable|numeric|between:-90,90',
            'office_longitude' => 'nullable|numeric|between:-180,180',
            'office_phone' => 'required|string',
            'office_hours' => 'nullable|string',
            'is_available' => 'boolean',
            'specialization_ids' => 'required|array|min:1',
            'specialization_ids.*' => 'exists:specializations,id',
            'profile_photo' => 'nullable|image|mimes:jpeg,jpg,png,gif|max:2048', // 2MB max
        ]);

        // Handle profile photo upload
        if ($request->hasFile('profile_photo')) {
            // Delete old profile photo if exists
            if ($lawyer->profile_photo) {
                Storage::disk('public')->delete($lawyer->profile_photo);
            }

            // Store new profile photo
            $path = $request->file('profile_photo')->store('lawyers/' . $lawyer->id, 'public');
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
            'office_address' => $validated['office_address'],
            'office_latitude' => $validated['office_latitude'] ?? null,
            'office_longitude' => $validated['office_longitude'] ?? null,
            'office_phone' => $validated['office_phone'],
            'office_hours' => $validated['office_hours'] ?? null,
            'is_available' => $validated['is_available'] ?? true,
        ]);

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

        // Validate (max 2MB due to PHP upload_max_filesize setting)
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'profile_photo' => 'required|image|mimes:jpeg,jpg,png,gif|max:2048', // 2MB max
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Delete old profile photo if exists
        if ($lawyer->profile_photo) {
            Storage::disk('public')->delete($lawyer->profile_photo);
        }

        // Store new profile photo
        $path = $request->file('profile_photo')->store('lawyers/' . $lawyer->id, 'public');

        $lawyer->profile_photo = $path;
        $lawyer->save();

        return response()->json([
            'message' => 'Profile photo uploaded successfully',
            'lawyer' => $lawyer,
            'profile_photo_url' => Storage::disk('public')->url($path)
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
            Storage::disk('public')->delete($lawyer->profile_photo);
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
}