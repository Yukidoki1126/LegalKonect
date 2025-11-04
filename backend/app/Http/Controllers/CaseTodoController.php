<?php

namespace App\Http\Controllers;

use App\Models\CaseModel;
use App\Models\CaseTodo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CaseTodoController extends Controller
{
    /**
     * Get all todos for a specific case
     */
    public function index($caseId)
    {
        $case = CaseModel::findOrFail($caseId);

        // Check if user has access to this case
        $user = Auth::user();

        // Debug logging
        \Log::info('Todo Index Authorization Check', [
            'case_id' => $case->id,
            'case_lawyer_id' => $case->lawyer_id,
            'case_user_id' => $case->user_id,
            'auth_user_id' => $user->id,
            'has_lawyer' => !is_null($user->lawyer),
            'auth_lawyer_id' => $user->lawyer ? $user->lawyer->id : null,
        ]);

        if ($case->user_id != $user->id && (!$user->lawyer || $case->lawyer_id != $user->lawyer->id)) {
            return response()->json([
                'message' => 'Unauthorized',
                'debug' => [
                    'case_lawyer_id' => $case->lawyer_id,
                    'your_lawyer_id' => $user->lawyer ? $user->lawyer->id : null,
                    'case_user_id' => $case->user_id,
                    'your_user_id' => $user->id,
                ]
            ], 403);
        }

        $todos = $case->todos()->orderBy('is_completed')->orderBy('created_at', 'desc')->get();

        return response()->json($todos);
    }

    /**
     * Store a new todo (Lawyer only)
     */
    public function store(Request $request, $caseId)
    {
        $case = CaseModel::findOrFail($caseId);

        // Check if user is the lawyer handling this case
        $user = Auth::user();
        if (!$user->lawyer || $case->lawyer_id != $user->lawyer->id) {
            return response()->json(['message' => 'Only the assigned lawyer can create todos'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'nullable|in:low,medium,high',
            'due_date' => 'nullable|date|after_or_equal:today',
        ]);

        $todo = $case->todos()->create($validated);

        return response()->json([
            'message' => 'Todo created successfully',
            'todo' => $todo
        ], 201);
    }

    /**
     * Update a todo
     */
    public function update(Request $request, $caseId, $todoId)
    {
        $case = CaseModel::findOrFail($caseId);
        $todo = CaseTodo::where('case_id', $caseId)->findOrFail($todoId);

        $user = Auth::user();

        // Lawyers can update any field
        if ($user->lawyer && $case->lawyer_id == $user->lawyer->id) {
            $validated = $request->validate([
                'title' => 'sometimes|string|max:255',
                'description' => 'nullable|string',
                'priority' => 'sometimes|in:low,medium,high',
                'is_completed' => 'sometimes|boolean',
                'due_date' => 'nullable|date',
            ]);

            if (isset($validated['is_completed'])) {
                if ($validated['is_completed']) {
                    $todo->markAsCompleted();
                } else {
                    $todo->markAsIncomplete();
                }
                unset($validated['is_completed']);
            }

            $todo->update($validated);

            return response()->json([
                'message' => 'Todo updated successfully',
                'todo' => $todo->fresh()
            ]);
        }

        // Clients can only mark todos as complete/incomplete
        if ($case->user_id == $user->id) {
            $validated = $request->validate([
                'is_completed' => 'required|boolean',
            ]);

            if ($validated['is_completed']) {
                $todo->markAsCompleted();
            } else {
                $todo->markAsIncomplete();
            }

            // Touch the case to update its updated_at timestamp
            $case->touch();

            return response()->json([
                'message' => 'Todo status updated successfully',
                'todo' => $todo->fresh()
            ]);
        }

        return response()->json(['message' => 'Unauthorized'], 403);
    }

    /**
     * Delete a todo (Lawyer only)
     */
    public function destroy($caseId, $todoId)
    {
        $case = CaseModel::findOrFail($caseId);
        $todo = CaseTodo::where('case_id', $caseId)->findOrFail($todoId);

        // Check if user is the lawyer handling this case
        $user = Auth::user();
        if (!$user->lawyer || $case->lawyer_id != $user->lawyer->id) {
            return response()->json(['message' => 'Only the assigned lawyer can delete todos'], 403);
        }

        $todo->delete();

        return response()->json(['message' => 'Todo deleted successfully']);
    }
}
