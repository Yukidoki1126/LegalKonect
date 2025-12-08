<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Admin;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        // Get authenticated user
        $user = $request->user();

        // Check if user exists
        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        // Check if user is an Admin model instance
        if ($user instanceof Admin) {
            // Admin model - check if active
            if (!$user->is_active) {
                return response()->json([
                    'message' => 'Your admin account has been suspended.'
                ], 403);
            }
            return $next($request);
        }

        // Check if user is a User model with admin role (legacy support)
        if ($user instanceof \App\Models\User) {
            // Check if user has admin role
            if ($user->role === 'admin' || $user->role === 'super_admin') {
                // User with admin role - allow access
                return $next($request);
            }
        }

        // Neither Admin model nor User with admin role
        return response()->json([
            'message' => 'Unauthorized. Admin access required.'
        ], 403);
    }
}