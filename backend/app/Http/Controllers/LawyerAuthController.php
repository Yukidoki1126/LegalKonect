<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Lawyer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class LawyerAuthController extends Controller
{
    /**
     * Register a new lawyer
     */
    public function register(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:lawyers',
            'password' => 'required|string|min:8|confirmed',
            'phone_number' => 'required|string|max:20',
            'license_number' => 'required|string|unique:lawyers',
            'specialization' => 'required|string|max:255',
            'years_of_experience' => 'required|integer|min:0',
            'consultation_fee' => 'required|numeric|min:0',
            'bio' => 'nullable|string',
            'city' => 'required|string|max:255',
            'province' => 'required|string|max:255',
        ]);

        $lawyer = Lawyer::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone_number' => $request->phone_number,
            'license_number' => $request->license_number,
            'specialization' => $request->specialization,
            'years_of_experience' => $request->years_of_experience,
            'consultation_fee' => $request->consultation_fee,
            'bio' => $request->bio,
            'city' => $request->city,
            'province' => $request->province,
            'status' => 'pending', // Requires admin approval
            'is_verified' => false,
        ]);

        // Create token for the lawyer
        $token = $lawyer->createToken('lawyer-token')->plainTextToken;

        return response()->json([
            'message' => 'Lawyer registered successfully. Awaiting admin approval.',
            'lawyer' => $lawyer,
            'token' => $token
        ], 201);
    }

    /**
     * Login for lawyers
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $lawyer = Lawyer::where('email', $request->email)->first();

        if (!$lawyer || !Hash::check($request->password, $lawyer->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Check if lawyer is approved
        if ($lawyer->status !== 'active') {
            return response()->json([
                'message' => 'Your account is pending approval. Please wait for admin verification.',
                'status' => $lawyer->status
            ], 403);
        }

        // Create token
        $token = $lawyer->createToken('lawyer-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'lawyer' => $lawyer,
            'token' => $token,
            'user_type' => 'lawyer'
        ]);
    }

    /**
     * Logout for lawyers
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Get current lawyer profile
     */
    public function profile(Request $request)
    {
        $lawyer = $request->user();
        
        // Load appointment statistics
        $stats = [
            'total_appointments' => $lawyer->appointments()->count(),
            'pending_appointments' => $lawyer->appointments()
                ->where('status', 'pending')->count(),
            'confirmed_appointments' => $lawyer->appointments()
                ->where('status', 'confirmed')->count(),
            'completed_appointments' => $lawyer->appointments()
                ->where('status', 'completed')->count(),
            'total_earnings' => $lawyer->appointments()
                ->where('payment_status', 'paid')
                ->where('status', 'completed')
                ->sum('amount'),
            'this_month_earnings' => $lawyer->appointments()
                ->where('payment_status', 'paid')
                ->where('status', 'completed')
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('amount'),
        ];

        return response()->json([
            'lawyer' => $lawyer,
            'stats' => $stats
        ]);
    }

    /**
     * Update lawyer profile
     */
    public function updateProfile(Request $request)
    {
        $lawyer = $request->user();

        $request->validate([
            'phone_number' => 'sometimes|string|max:20',
            'specialization' => 'sometimes|string|max:255',
            'consultation_fee' => 'sometimes|numeric|min:0',
            'bio' => 'nullable|string',
            'city' => 'sometimes|string|max:255',
            'province' => 'sometimes|string|max:255',
        ]);

        $lawyer->update($request->only([
            'phone_number', 'specialization', 'consultation_fee', 
            'bio', 'city', 'province'
        ]));

        return response()->json([
            'message' => 'Profile updated successfully',
            'lawyer' => $lawyer
        ]);
    }
}