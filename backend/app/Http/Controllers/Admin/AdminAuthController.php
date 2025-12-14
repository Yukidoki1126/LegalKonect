<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AdminAuthController extends Controller
{
    /**
     * Admin Login
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // Find admin in admins table
        $admin = Admin::where('email', $request->email)->first();

        if (!$admin || !Hash::check($request->password, $admin->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Check if account is active
        if (!$admin->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Your admin account has been suspended.'],
            ]);
        }

        // Update last login
        $admin->update(['last_login_at' => now()]);

        // Create token
        $token = $admin->createToken('admin-token')->plainTextToken;

        return response()->json([
            'admin' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'role' => $admin->role,
                'status' => $admin->is_active ? 'active' : 'suspended',
                'last_login_at' => $admin->last_login_at,
            ],
            'token' => $token,
            'message' => 'Login successful'
        ]);
    }

    /**
     * Get Authenticated Admin
     */
    public function me(Request $request)
    {
        $user = $request->user();

        // Handle both Admin model (admins table) and User model (users table with admin role)
        $isActive = property_exists($user, 'is_active') ? $user->is_active : ($user->status === 'active');
        
        return response()->json([
            'admin' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $isActive ? 'active' : 'suspended',
                'last_login_at' => $user->last_login_at,
            ]
        ]);
    }

    /**
     * Admin Logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }
}