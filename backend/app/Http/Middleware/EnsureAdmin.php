<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        \Log::info('EnsureAdmin middleware triggered', ['path' => $request->path()]);

        // Try to get user from default guard first
        $user = $request->user();
        \Log::info('Initial user check', ['has_user' => $user !== null, 'user_type' => $user ? get_class($user) : 'null']);

        // If no user found or user is not Admin, try to authenticate as Admin directly
        if (!$user || !($user instanceof \App\Models\Admin)) {
            // Get the token from the request
            $bearerToken = $request->bearerToken();
            \Log::info('Token check', ['has_token' => $bearerToken !== null]);

            if ($bearerToken) {
                // Hash the token to match what's stored in the database
                $tokenHash = hash('sha256', $bearerToken);

                // Find the token in the database
                $accessToken = DB::table('personal_access_tokens')
                    ->where('token', $tokenHash)
                    ->first();

                \Log::info('Access token lookup', [
                    'found' => $accessToken !== null,
                    'tokenable_type' => $accessToken ? $accessToken->tokenable_type : 'null'
                ]);

                if ($accessToken && $accessToken->tokenable_type === 'App\\Models\\Admin') {
                    // Load the admin user
                    $user = \App\Models\Admin::find($accessToken->tokenable_id);

                    if ($user) {
                        \Log::info('Admin user loaded', ['admin_id' => $user->id]);

                        // Update last_used_at timestamp
                        DB::table('personal_access_tokens')
                            ->where('id', $accessToken->id)
                            ->update(['last_used_at' => now()]);

                        // Set the authenticated user for this request
                        $request->setUserResolver(function () use ($user) {
                            return $user;
                        });
                    }
                }
            }
        }

        // Final check
        if (!$user || !($user instanceof \App\Models\Admin)) {
            \Log::warning('Admin access denied', [
                'has_user' => $user !== null,
                'user_type' => $user ? get_class($user) : 'null'
            ]);

            return response()->json([
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        if (!$user->is_active) {
            \Log::warning('Inactive admin attempt', ['admin_id' => $user->id]);

            return response()->json([
                'message' => 'Your admin account is inactive.'
            ], 403);
        }

        \Log::info('Admin access granted', ['admin_id' => $user->id]);
        return $next($request);
    }
}