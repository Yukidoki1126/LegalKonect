<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Admin;
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

        $admins = Admin::whereIn('role', [Admin::ROLE_ADMIN, Admin::ROLE_SUPER_ADMIN])
            ->select('id', 'name', 'email', 'role', 'is_active', 'last_login_at', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($admin) {
                return [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'role' => $admin->role,
                    'status' => $admin->is_active ? 'active' : 'suspended',
                    'last_login_at' => $admin->last_login_at,
                    'created_at' => $admin->created_at,
                ];
            });

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
            'email' => 'required|email|unique:admins,email',
            'password' => 'required|string|min:8',
            'role' => ['required', Rule::in([Admin::ROLE_ADMIN, Admin::ROLE_SUPER_ADMIN])],
        ]);

        $admin = Admin::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Admin created successfully',
            'admin' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'role' => $admin->role,
                'status' => $admin->is_active ? 'active' : 'suspended',
                'last_login_at' => $admin->last_login_at,
                'created_at' => $admin->created_at,
            ]
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

        $admin = Admin::findOrFail($id);

        // Prevent modifying own account through this endpoint
        if ($admin->id === $request->user()->id) {
            return response()->json(['message' => 'Cannot modify your own account through this endpoint'], 400);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'email', Rule::unique('admins')->ignore($id)],
            'password' => 'sometimes|nullable|string|min:8',
            'role' => ['sometimes', 'required', Rule::in([Admin::ROLE_ADMIN, Admin::ROLE_SUPER_ADMIN])],
            'status' => ['sometimes', 'required', Rule::in(['active', 'suspended'])],
        ]);

        // Convert status to is_active
        if (isset($validated['status'])) {
            $validated['is_active'] = $validated['status'] === 'active';
            unset($validated['status']);
        }

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $admin->update($validated);

        return response()->json([
            'message' => 'Admin updated successfully',
            'admin' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'role' => $admin->role,
                'status' => $admin->is_active ? 'active' : 'suspended',
                'last_login_at' => $admin->last_login_at,
                'created_at' => $admin->created_at,
            ]
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

        $admin = Admin::findOrFail($id);

        // Prevent deleting own account
        if ($admin->id === $request->user()->id) {
            return response()->json(['message' => 'Cannot delete your own account'], 400);
        }

        // Check if this is the last super admin
        if ($admin->isSuperAdmin()) {
            $superAdminCount = Admin::where('role', Admin::ROLE_SUPER_ADMIN)->count();
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
            'total_admins' => Admin::where('role', Admin::ROLE_ADMIN)->count(),
            'total_super_admins' => Admin::where('role', Admin::ROLE_SUPER_ADMIN)->count(),
            'active_admins' => Admin::whereIn('role', [Admin::ROLE_ADMIN, Admin::ROLE_SUPER_ADMIN])
                ->where('is_active', true)
                ->count(),
            'suspended_admins' => Admin::whereIn('role', [Admin::ROLE_ADMIN, Admin::ROLE_SUPER_ADMIN])
                ->where('is_active', false)
                ->count(),
        ];

        return response()->json($stats);
    }
}
