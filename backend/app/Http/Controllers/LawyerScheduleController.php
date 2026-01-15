<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class LawyerScheduleController extends Controller
{
    /**
     * Get all schedules for the authenticated lawyer
     */
    public function index()
    {
        $user = Auth::user();
        $lawyer = DB::table('lawyers')->where('user_id', $user->id)->first();

        if (!$lawyer) {
            return response()->json(['message' => 'Lawyer not found'], 404);
        }

        $schedules = DB::table('lawyer_schedules')
            ->where('lawyer_id', $lawyer->id)
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();

        return response()->json($schedules);
    }

    /**
     * Store a new schedule
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        $lawyer = DB::table('lawyers')->where('user_id', $user->id)->first();

        if (!$lawyer) {
            return response()->json(['message' => 'Lawyer not found'], 404);
        }

        $validated = $request->validate([
            'day_of_week' => 'required|string|in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'daily_appointment_limit' => 'nullable|integer|min:1|max:50',
        ]);

        // Check for overlapping schedules
        $overlap = DB::table('lawyer_schedules')
            ->where('lawyer_id', $lawyer->id)
            ->where('day_of_week', $validated['day_of_week'])
            ->where('is_active', true)
            ->where(function($query) use ($validated) {
                $query->whereBetween('start_time', [$validated['start_time'], $validated['end_time']])
                      ->orWhereBetween('end_time', [$validated['start_time'], $validated['end_time']])
                      ->orWhere(function($q) use ($validated) {
                          $q->where('start_time', '<=', $validated['start_time'])
                            ->where('end_time', '>=', $validated['end_time']);
                      });
            })
            ->exists();

        if ($overlap) {
            return response()->json([
                'message' => 'This time slot overlaps with an existing schedule'
            ], 422);
        }

        $scheduleId = DB::table('lawyer_schedules')->insertGetId([
            'lawyer_id' => $lawyer->id,
            'day_of_week' => $validated['day_of_week'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'is_active' => true,
            'daily_appointment_limit' => $validated['daily_appointment_limit'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $schedule = DB::table('lawyer_schedules')->where('id', $scheduleId)->first();

        return response()->json([
            'message' => 'Schedule created successfully',
            'schedule' => $schedule
        ], 201);
    }

    /**
     * Update a schedule
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $lawyer = DB::table('lawyers')->where('user_id', $user->id)->first();

        if (!$lawyer) {
            return response()->json(['message' => 'Lawyer not found'], 404);
        }

        $schedule = DB::table('lawyer_schedules')
            ->where('id', $id)
            ->where('lawyer_id', $lawyer->id)
            ->first();

        if (!$schedule) {
            return response()->json(['message' => 'Schedule not found'], 404);
        }

        $validated = $request->validate([
            'day_of_week' => 'required|string|in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'is_active' => 'sometimes|boolean',
            'daily_appointment_limit' => 'nullable|integer|min:1|max:50',
        ]);

        // Check for overlapping schedules (excluding current schedule)
        $overlap = DB::table('lawyer_schedules')
            ->where('lawyer_id', $lawyer->id)
            ->where('id', '!=', $id)
            ->where('day_of_week', $validated['day_of_week'])
            ->where('is_active', true)
            ->where(function($query) use ($validated) {
                $query->whereBetween('start_time', [$validated['start_time'], $validated['end_time']])
                      ->orWhereBetween('end_time', [$validated['start_time'], $validated['end_time']])
                      ->orWhere(function($q) use ($validated) {
                          $q->where('start_time', '<=', $validated['start_time'])
                            ->where('end_time', '>=', $validated['end_time']);
                      });
            })
            ->exists();

        if ($overlap) {
            return response()->json([
                'message' => 'This time slot overlaps with an existing schedule'
            ], 422);
        }

        // Prepare update data
        $updateData = [
            'day_of_week' => $validated['day_of_week'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'is_active' => $validated['is_active'] ?? $schedule->is_active,
            'updated_at' => now(),
        ];

        // Handle daily_appointment_limit: if key exists in validated, use it (even if null)
        // Otherwise, keep the existing value
        if (array_key_exists('daily_appointment_limit', $validated)) {
            $updateData['daily_appointment_limit'] = $validated['daily_appointment_limit'];
        }

        DB::table('lawyer_schedules')
            ->where('id', $id)
            ->update($updateData);

        $updatedSchedule = DB::table('lawyer_schedules')->where('id', $id)->first();

        return response()->json([
            'message' => 'Schedule updated successfully',
            'schedule' => $updatedSchedule
        ]);
    }

    /**
     * Delete a schedule
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $lawyer = DB::table('lawyers')->where('user_id', $user->id)->first();

        if (!$lawyer) {
            return response()->json(['message' => 'Lawyer not found'], 404);
        }

        $schedule = DB::table('lawyer_schedules')
            ->where('id', $id)
            ->where('lawyer_id', $lawyer->id)
            ->first();

        if (!$schedule) {
            return response()->json(['message' => 'Schedule not found'], 404);
        }

        DB::table('lawyer_schedules')->where('id', $id)->delete();

        return response()->json([
            'message' => 'Schedule deleted successfully'
        ]);
    }

    /**
     * Toggle schedule active status
     */
    public function toggleActive($id)
    {
        $user = Auth::user();
        $lawyer = DB::table('lawyers')->where('user_id', $user->id)->first();

        if (!$lawyer) {
            return response()->json(['message' => 'Lawyer not found'], 404);
        }

        $schedule = DB::table('lawyer_schedules')
            ->where('id', $id)
            ->where('lawyer_id', $lawyer->id)
            ->first();

        if (!$schedule) {
            return response()->json(['message' => 'Schedule not found'], 404);
        }

        $newStatus = !$schedule->is_active;

        DB::table('lawyer_schedules')
            ->where('id', $id)
            ->update([
                'is_active' => $newStatus,
                'updated_at' => now(),
            ]);

        return response()->json([
            'message' => 'Schedule status updated successfully',
            'is_active' => $newStatus
        ]);
    }
}
