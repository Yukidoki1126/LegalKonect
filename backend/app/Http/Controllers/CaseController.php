<?php

namespace App\Http\Controllers;

use App\Models\CaseModel;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CaseController extends Controller
{
    /**
     * Get all cases for the authenticated user
     */
    public function index(Request $request)
    {
        $cases = $request->user()
            ->cases()
            ->with(['appointment', 'lawyer:id,first_name,last_name', 'todos'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($cases);
    }

    /**
     * Create a new case from an appointment
     */
    public function store(Request $request)
    {
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

        // Verify appointment belongs to user
        $appointment = Appointment::findOrFail($request->appointment_id);
        if ($appointment->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        // Check if case already exists for this appointment
        $existingCase = CaseModel::where('appointment_id', $appointment->id)->first();
        if ($existingCase) {
            return response()->json([
                'message' => 'A case already exists for this appointment',
                'case' => $existingCase->load(['appointment', 'lawyer'])
            ], 409);
        }

        $case = CaseModel::create([
            'appointment_id' => $appointment->id,
            'user_id' => $request->user()->id,
            'lawyer_id' => $appointment->lawyer_id,
            'title' => $request->title,
            'description' => $request->description,
            'case_type' => $request->case_type,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Case created successfully',
            'case' => $case->load(['appointment', 'lawyer'])
        ], 201);
    }

    /**
     * Get a specific case
     */
    public function show(Request $request, $id)
    {
        $case = $request->user()
            ->cases()
            ->with(['appointment', 'lawyer:id,first_name,last_name'])
            ->findOrFail($id);

        return response()->json($case);
    }

    /**
     * Update case (client can only update pending cases)
     */
    public function update(Request $request, $id)
    {
        $case = $request->user()->cases()->findOrFail($id);

        // Only allow updates if status is pending
        if ($case->status !== 'pending') {
            return response()->json([
                'message' => 'Cannot update case that is already in progress or closed'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|nullable|string',
            'case_type' => 'sometimes|nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $case->update($request->only(['title', 'description', 'case_type']));

        return response()->json([
            'message' => 'Case updated successfully',
            'case' => $case->load(['appointment', 'lawyer'])
        ]);
    }

    /**
     * Delete a case (only if pending)
     */
    public function destroy(Request $request, $id)
    {
        $case = $request->user()->cases()->findOrFail($id);

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
