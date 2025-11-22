<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\User;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        // Get authenticated user
        $user = $request->user();

        // Check if user exists and has admin or super_admin role
        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        // Check if user is admin or super_admin using the isAdmin() method
        if (!$user->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        // Check if account is suspended
        if ($user->status === 'suspended') {
            return response()->json([
                'message' => 'Your admin account has been suspended.'
            ], 403);
        }

        return $next($request);
    }
}