<?php

namespace App\Http\Controllers;

use App\Models\CaseModel;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LawyerCaseController extends Controller
{
    /**
     * Get all cases for the authenticated lawyer
     */
    public function index(Request $request)
    {
        $lawyer = $request->user()->lawyer;

        if (!$lawyer) {
            return response()->json([
                'message' => 'User is not registered as a lawyer'
            ], 403);
        }

        $cases = CaseModel::where('lawyer_id', $lawyer->id)
            ->with(['appointment', 'user:id,name,email', 'todos'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($cases);
    }

    /**
     * Get lawyer's completed appointments (for creating cases)
     */
    public function getCompletedAppointments(Request $request)
    {
        $lawyer = $request->user()->lawyer;

        if (!$lawyer) {
            return response()->json([
                'message' => 'User is not registered as a lawyer'
            ], 403);
        }

        $appointments = Appointment::where('lawyer_id', $lawyer->id)
            ->where('status', 'completed')
            ->whereDoesntHave('case') // Only show appointments without cases
            ->with(['user:id,name,email'])
            ->orderBy('appointment_date', 'desc')
            ->orderBy('appointment_time', 'desc')
            ->get();

        return response()->json($appointments);
    }

    /**
     * Create a new case for a client
     */
    public function store(Request $request)
    {
        $lawyer = $request->user()->lawyer;

        if (!$lawyer) {
            return response()->json([
                'message' => 'User is not registered as a lawyer'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'appointment_id' => 'required|exists:appointments,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'case_type' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Verify appointment belongs to this lawyer
        $appointment = Appointment::findOrFail($request->appointment_id);

        // Debug logging
        \Log::info('Case creation attempt', [
            'lawyer_id' => $lawyer->id,
            'lawyer_id_type' => gettype($lawyer->id),
            'appointment_lawyer_id' => $appointment->lawyer_id,
            'appointment_lawyer_id_type' => gettype($appointment->lawyer_id),
            'appointment_id' => $appointment->id,
            'strict_match' => $appointment->lawyer_id === $lawyer->id,
            'loose_match' => $appointment->lawyer_id == $lawyer->id
        ]);

        if ($appointment->lawyer_id != $lawyer->id) {
            return response()->json([
                'message' => 'This appointment does not belong to you'
            ], 403);
        }

        // Verify appointment is completed
        if ($appointment->status !== 'completed') {
            return response()->json([
                'message' => 'Can only create cases from completed appointments'
            ], 422);
        }

        // Check if case already exists for this appointment
        $existingCase = CaseModel::where('appointment_id', $appointment->id)->first();
        if ($existingCase) {
            return response()->json([
                'message' => 'A case already exists for this appointment',
                'case' => $existingCase->load(['appointment', 'user'])
            ], 409);
        }

        $case = CaseModel::create([
            'appointment_id' => $appointment->id,
            'user_id' => $appointment->user_id,
            'lawyer_id' => $lawyer->id,
            'title' => $request->title,
            'description' => $request->description,
            'case_type' => $request->case_type,
            'status' => 'pending',
            'started_at' => now(),
        ]);

        return response()->json([
            'message' => 'Case created successfully',
            'case' => $case->load(['appointment', 'user'])
        ], 201);
    }

    /**
     * Get a specific case
     */
    public function show(Request $request, $id)
    {
        $lawyer = $request->user()->lawyer;

        if (!$lawyer) {
            return response()->json([
                'message' => 'User is not registered as a lawyer'
            ], 403);
        }

        $case = CaseModel::where('lawyer_id', $lawyer->id)
            ->with(['appointment', 'user:id,name,email'])
            ->findOrFail($id);

        return response()->json($case);
    }

    /**
     * Update case status and add updates
     */
    public function update(Request $request, $id)
    {
        $lawyer = $request->user()->lawyer;

        if (!$lawyer) {
            return response()->json([
                'message' => 'User is not registered as a lawyer'
            ], 403);
        }

        $case = CaseModel::where('lawyer_id', $lawyer->id)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|nullable|string',
            'case_type' => 'sometimes|nullable|string|max:100',
            'status' => 'sometimes|required|in:pending,ongoing,closed',
            'lawyer_updates' => 'sometimes|nullable|string',
            'resolution_summary' => 'sometimes|nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $updateData = $request->only(['title', 'description', 'case_type', 'status', 'lawyer_updates', 'resolution_summary']);

        // If status is being changed to closed, set closed_at
        if (isset($updateData['status']) && $updateData['status'] === 'closed' && $case->status !== 'closed') {
            $updateData['closed_at'] = now();
        }

        $case->update($updateData);

        return response()->json([
            'message' => 'Case updated successfully',
            'case' => $case->load(['appointment', 'user'])
        ]);
    }

    /**
     * Delete a case (only if pending)
     */
    public function destroy(Request $request, $id)
    {
        $lawyer = $request->user()->lawyer;

        if (!$lawyer) {
            return response()->json([
                'message' => 'User is not registered as a lawyer'
            ], 403);
        }

        $case = CaseModel::where('lawyer_id', $lawyer->id)->findOrFail($id);

        if ($case->status !== 'pending') {
            return response()->json([
                'message' => 'Cannot delete case that is already in progress or closed'
            ], 403);
        }

        $case->delete();

        return response()->json([
            'message' => 'Case deleted successfully'
        ]);
    }
}
