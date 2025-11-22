<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminManagementController extends Controller
{
    /**
     * Get all admins (admin and super_admin roles)
     */
    public function index(Request $request)
    {
        // Only super admins can access this
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized. Super Admin access required.'], 403);
        }

        $admins = User::whereIn('role', [User::ROLE_ADMIN, User::ROLE_SUPER_ADMIN])
            ->select('id', 'name', 'email', 'role', 'status', 'last_login_at', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($admins);
    }

    /**
     * Create a new admin
     */
    public function store(Request $request)
    {
        // Only super admins can create admins
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized. Super Admin access required.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => ['required', Rule::in([User::ROLE_ADMIN, User::ROLE_SUPER_ADMIN])],
        ]);

        $admin = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'email_verified_at' => now(),
            'status' => 'active',
        ]);

        return response()->json([
            'message' => 'Admin created successfully',
            'admin' => $admin
        ], 201);
    }

    /**
     * Update an admin
     */
    public function update(Request $request, $id)
    {
        // Only super admins can update admins
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized. Super Admin access required.'], 403);
        }

        $admin = User::findOrFail($id);

        // Prevent modifying own account through this endpoint
        if ($admin->id === $request->user()->id) {
            return response()->json(['message' => 'Cannot modify your own account through this endpoint'], 400);
        }

        // Ensure the user is an admin
        if (!in_array($admin->role, [User::ROLE_ADMIN, User::ROLE_SUPER_ADMIN])) {
            return response()->json(['message' => 'User is not an admin'], 400);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'email', Rule::unique('users')->ignore($id)],
            'password' => 'sometimes|nullable|string|min:8',
            'role' => ['sometimes', 'required', Rule::in([User::ROLE_ADMIN, User::ROLE_SUPER_ADMIN])],
            'status' => ['sometimes', 'required', Rule::in(['active', 'suspended'])],
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $admin->update($validated);

        return response()->json([
            'message' => 'Admin updated successfully',
            'admin' => $admin
        ]);
    }

    /**
     * Delete an admin
     */
    public function destroy(Request $request, $id)
    {
        // Only super admins can delete admins
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized. Super Admin access required.'], 403);
        }

        $admin = User::findOrFail($id);

        // Prevent deleting own account
        if ($admin->id === $request->user()->id) {
            return response()->json(['message' => 'Cannot delete your own account'], 400);
        }

        // Ensure the user is an admin
        if (!in_array($admin->role, [User::ROLE_ADMIN, User::ROLE_SUPER_ADMIN])) {
            return response()->json(['message' => 'User is not an admin'], 400);
        }

        // Check if this is the last super admin
        if ($admin->isSuperAdmin()) {
            $superAdminCount = User::where('role', User::ROLE_SUPER_ADMIN)->count();
            if ($superAdminCount <= 1) {
                return response()->json(['message' => 'Cannot delete the last super admin'], 400);
            }
        }

        $admin->delete();

        return response()->json([
            'message' => 'Admin deleted successfully'
        ]);
    }

    /**
     * Get admin statistics
     */
    public function stats(Request $request)
    {
        // Only super admins can access this
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized. Super Admin access required.'], 403);
        }

        $stats = [
            'total_admins' => User::where('role', User::ROLE_ADMIN)->count(),
            'total_super_admins' => User::where('role', User::ROLE_SUPER_ADMIN)->count(),
            'active_admins' => User::whereIn('role', [User::ROLE_ADMIN, User::ROLE_SUPER_ADMIN])
                ->where('status', 'active')
                ->count(),
            'suspended_admins' => User::whereIn('role', [User::ROLE_ADMIN, User::ROLE_SUPER_ADMIN])
                ->where('status', 'suspended')
                ->count(),
        ];

        return response()->json($stats);
    }
}
