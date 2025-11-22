<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use App\Services\GoogleAuthService;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
                'regex:/[a-z]/',      // must contain at least one lowercase letter
                'regex:/[A-Z]/',      // must contain at least one uppercase letter
                'regex:/[0-9]/',      // must contain at least one digit
                'regex:/[@$!%*#?&]/', // must contain at least one special character
            ],
            'phone' => 'nullable|string|max:20',
        ], [
            'password.regex' => 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*#?&).',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful',
            'user' => $user,
            'token' => $token
        ], 201);
    }

    public function login(Request $request)
{
    $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    $user = User::where('email', $request->email)->first();

    if (!$user || !Hash::check($request->password, $user->password)) {
        throw ValidationException::withMessages([
            'email' => ['The provided credentials are incorrect.'],
        ]);
    }

    // Check if user is suspended
    if ($user->status === 'suspended') {
        throw ValidationException::withMessages([
            'email' => ['Your account has been suspended. Please contact support.'],
        ]);
    }

    // Load lawyer relationship with status
    $user->load('lawyer');

    $token = $user->createToken('auth-token')->plainTextToken;

    return response()->json([
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'lawyer' => $user->lawyer ? [
                'id' => $user->lawyer->id,
                'first_name' => $user->lawyer->first_name,
                'last_name' => $user->lawyer->last_name,
                'status' => $user->lawyer->status, // CRITICAL: Include status
            ] : null
        ],
        'token' => $token,
    ]);
}

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout successful'
        ]);
    }

    public function profile(Request $request)
    {
        $user = $request->user();
        $user->load('lawyer'); // Load the lawyer relationship

        return response()->json([
            'user' => $user
        ]);
    }

    public function updateLocation(Request $request)
{
    $request->validate([
        'latitude' => 'required|numeric|between:-90,90',
        'longitude' => 'required|numeric|between:-180,180',
        'address' => 'required|string|max:500',
        'city' => 'nullable|string|max:100',
        'province' => 'nullable|string|max:100',
    ]);

    $user = $request->user();
    
    $user->update([
        'latitude' => $request->latitude,
        'longitude' => $request->longitude,
        'address' => $request->address,
        'city' => $request->city,
        'province' => $request->province,
    ]);

    return response()->json([
        'message' => 'Location updated successfully',
        'user' => $user
    ]);
}
public function updateProfile(Request $request)
{
    $request->validate([
        'name' => 'sometimes|string|max:255',
        'email' => 'sometimes|email|unique:users,email,' . $request->user()->id,
        'phone' => 'nullable|string|max:20',
        'profile_picture' => 'nullable|image|mimes:jpeg,jpg,png,gif|max:2048', // 2MB max
    ]);

    $user = $request->user();

    // Handle profile picture upload
    if ($request->hasFile('profile_picture')) {
        // Delete old profile picture if exists
        if ($user->profile_picture) {
            Storage::disk('public')->delete($user->profile_picture);
        }

        // Store new profile picture
        $path = $request->file('profile_picture')->store('users/' . $user->id, 'public');
        $user->profile_picture = $path;
    }

    // Update other fields
    if ($request->has('name')) {
        $user->name = $request->name;
    }
    if ($request->has('email')) {
        $user->email = $request->email;
    }
    if ($request->has('phone')) {
        $user->phone = $request->phone;
    }

    $user->save();

    return response()->json([
        'message' => 'Profile updated successfully',
        'user' => $user
    ]);
}

    public function uploadProfilePicture(Request $request)
    {
        $request->validate([
            'profile_picture' => 'required|image|mimes:jpeg,jpg,png,gif|max:2048', // 2MB max
        ]);

        $user = $request->user();

        // Delete old profile picture if exists
        if ($user->profile_picture) {
            Storage::disk('public')->delete($user->profile_picture);
        }

        // Store new profile picture
        $path = $request->file('profile_picture')->store('users/' . $user->id, 'public');

        $user->profile_picture = $path;
        $user->save();

        return response()->json([
            'message' => 'Profile picture uploaded successfully',
            'user' => $user,
            'profile_picture_url' => Storage::disk('public')->url($path)
        ]);
    }

    public function deleteProfilePicture(Request $request)
    {
        $user = $request->user();

        if ($user->profile_picture) {
            Storage::disk('public')->delete($user->profile_picture);
            $user->profile_picture = null;
            $user->save();
        }

        return response()->json([
            'message' => 'Profile picture deleted successfully',
            'user' => $user
        ]);
    }

    /**
     * Get Google OAuth authorization URL
     */
    public function googleAuthUrl(GoogleAuthService $googleAuthService)
    {
        try {
            $authUrl = $googleAuthService->getAuthUrl();

            return response()->json([
                'auth_url' => $authUrl
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get Google auth URL', ['error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Failed to generate authorization URL'
            ], 500);
        }
    }

    /**
     * Handle Google OAuth callback
     */
    public function googleCallback(Request $request, GoogleAuthService $googleAuthService)
    {
        try {
            $code = $request->query('code');

            if (!$code) {
                return redirect(config('app.frontend_url', 'http://localhost:5173') . '/login?error=no_code');
            }

            // Exchange code for user
            $user = $googleAuthService->handleCallback($code);

            if (!$user) {
                return redirect(config('app.frontend_url', 'http://localhost:5173') . '/login?error=auth_failed');
            }

            // Create auth token
            $token = $user->createToken('auth_token')->plainTextToken;

            // Redirect to frontend with token
            $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
            return redirect($frontendUrl . '/auth/google/callback?token=' . $token);

        } catch (\Exception $e) {
            Log::error('Google OAuth callback failed', ['error' => $e->getMessage()]);

            return redirect(config('app.frontend_url', 'http://localhost:5173') . '/login?error=callback_failed');
        }
    }

    /**
     * Login with Google ID Token (for direct API calls)
     */
    public function googleLogin(Request $request, GoogleAuthService $googleAuthService)
    {
        $request->validate([
            'id_token' => 'required|string',
        ]);

        try {
            $userData = $googleAuthService->verifyIdToken($request->id_token);

            if (!$userData) {
                return response()->json([
                    'message' => 'Invalid Google token'
                ], 401);
            }

            // Find or create user
            $user = User::where('google_id', $userData['id'])->first();

            if (!$user) {
                $user = User::where('email', $userData['email'])->first();

                if ($user) {
                    // Link Google account
                    $user->update([
                        'google_id' => $userData['id'],
                        'avatar' => $userData['picture'],
                        'auth_provider' => 'google',
                    ]);
                } else {
                    // Create new user
                    $user = User::create([
                        'name' => $userData['name'],
                        'email' => $userData['email'],
                        'google_id' => $userData['id'],
                        'avatar' => $userData['picture'],
                        'auth_provider' => 'google',
                        'password' => Hash::make(\Illuminate\Support\Str::random(32)),
                        'email_verified_at' => now(),
                    ]);
                }
            }

            // Create token
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => 'Login successful',
                'user' => $user,
                'token' => $token
            ]);

        } catch (\Exception $e) {
            Log::error('Google login failed', ['error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Authentication failed'
            ], 500);
        }
    }

    /**
     * Cleanup orphaned user account (user with no lawyer profile)
     * This is used when lawyer registration fails after user creation
     */
    public function cleanupOrphanedAccount(Request $request)
    {
        $user = $request->user();

        // Only allow cleanup if user has no lawyer profile and no appointments
        if ($user->lawyer) {
            return response()->json([
                'message' => 'Cannot delete account with existing lawyer profile'
            ], 422);
        }

        // Check if user has any appointments
        $appointmentsCount = $user->appointments()->count();
        if ($appointmentsCount > 0) {
            return response()->json([
                'message' => 'Cannot delete account with existing appointments'
            ], 422);
        }

        try {
            // Delete the user account
            $user->delete();

            return response()->json([
                'message' => 'Account cleaned up successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to cleanup orphaned account', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to cleanup account'
            ], 500);
        }
    }
}