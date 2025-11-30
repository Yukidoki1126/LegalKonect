<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Carbon\Carbon;

class PasswordResetController extends Controller
{
    /**
     * Send password reset link to user's email
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            // Return success even if user doesn't exist (security best practice)
            return response()->json([
                'message' => 'If an account with that email exists, we have sent a password reset link.'
            ]);
        }

        // Delete any existing tokens for this user
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        // Generate token
        $token = Str::random(64);

        // Store token in database
        DB::table('password_reset_tokens')->insert([
            'email' => $request->email,
            'token' => Hash::make($token),
            'created_at' => Carbon::now()
        ]);

        // Create reset link
        $resetLink = config('app.frontend_url', 'http://localhost:3000') . '/reset-password?token=' . $token . '&email=' . urlencode($request->email);

        // Send email
        try {
            Mail::send('emails.password-reset', [
                'user' => $user,
                'resetLink' => $resetLink,
            ], function ($message) use ($user) {
                $message->to($user->email)
                    ->subject('Reset Your Password - LegalKonect');
            });
        } catch (\Exception $e) {
            \Log::error('Password reset email failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to send reset email. Please try again later.'
            ], 500);
        }

        return response()->json([
            'message' => 'If an account with that email exists, we have sent a password reset link.'
        ]);
    }

    /**
     * Validate password reset token
     */
    public function validateToken(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$record) {
            return response()->json([
                'valid' => false,
                'message' => 'Invalid or expired reset token.'
            ], 400);
        }

        // Check if token matches
        if (!Hash::check($request->token, $record->token)) {
            return response()->json([
                'valid' => false,
                'message' => 'Invalid or expired reset token.'
            ], 400);
        }

        // Check if token is expired (1 hour)
        if (Carbon::parse($record->created_at)->addHour()->isPast()) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json([
                'valid' => false,
                'message' => 'Reset token has expired. Please request a new one.'
            ], 400);
        }

        return response()->json([
            'valid' => true,
            'message' => 'Token is valid.'
        ]);
    }

    /**
     * Reset password with token
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]+$/'
            ],
        ], [
            'password.regex' => 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*#?&).',
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$record) {
            return response()->json([
                'message' => 'Invalid or expired reset token.'
            ], 400);
        }

        // Check if token matches
        if (!Hash::check($request->token, $record->token)) {
            return response()->json([
                'message' => 'Invalid or expired reset token.'
            ], 400);
        }

        // Check if token is expired (1 hour)
        if (Carbon::parse($record->created_at)->addHour()->isPast()) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json([
                'message' => 'Reset token has expired. Please request a new one.'
            ], 400);
        }

        // Find user and update password
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'User not found.'
            ], 404);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        // Delete the used token
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        // Send confirmation email
        try {
            Mail::send('emails.password-changed', [
                'user' => $user,
            ], function ($message) use ($user) {
                $message->to($user->email)
                    ->subject('Password Changed Successfully - LegalKonect');
            });
        } catch (\Exception $e) {
            \Log::error('Password changed confirmation email failed: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Password has been reset successfully. You can now login with your new password.'
        ]);
    }
}
