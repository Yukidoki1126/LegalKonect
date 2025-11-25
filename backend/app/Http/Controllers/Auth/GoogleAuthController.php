<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class GoogleAuthController extends Controller
{
    /**
     * Handle Google OAuth authentication
     */
    public function handleGoogleAuth(Request $request)
    {
        $request->validate([
            'access_token' => 'required|string',
            'email' => 'required|email',
            'name' => 'required|string',
            'picture' => 'nullable|string',
        ]);

        try {
            // Find or create user
            $user = User::where('email', $request->email)->first();

            if (!$user) {
                // Create new user with Google account
                $user = User::create([
                    'name' => $request->name,
                    'email' => $request->email,
                    'password' => Hash::make(Str::random(32)), // Random password for Google users
                    'email_verified_at' => now(), // Auto-verify Google emails
                    'google_id' => $request->access_token,
                ]);

                // Save profile picture if provided
                if ($request->picture) {
                    $user->profile_picture = $request->picture;
                    $user->save();
                }
            } else {
                // Update existing user's Google info
                $user->update([
                    'google_id' => $request->access_token,
                    'email_verified_at' => $user->email_verified_at ?? now(),
                ]);

                if ($request->picture && !$user->profile_picture) {
                    $user->profile_picture = $request->picture;
                    $user->save();
                }
            }

            // Generate API token
            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'token' => $token,
                'user' => $user,
                'message' => 'Successfully authenticated with Google',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Google authentication failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
