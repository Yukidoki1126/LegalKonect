<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo(Request $request): ?string
    {
        // For API requests, return null (no redirect, will return 401 JSON response)
        if ($request->is('api/*') || $request->expectsJson() || $request->ajax()) {
            return null;
        }

        return route('login');
    }

    /**
     * Handle unauthenticated user.
     */
    protected function unauthenticated($request, array $guards)
    {
        // Always return JSON for API routes
        if ($request->is('api/*') || $request->expectsJson() || $request->ajax()) {
            abort(response()->json([
                'message' => 'Unauthenticated. Please provide a valid token.',
                'error' => 'Token missing or invalid'
            ], 401));
        }

        parent::unauthenticated($request, $guards);
    }
}
