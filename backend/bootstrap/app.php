<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Middleware\HandleCors;
use App\Http\Middleware\EnsureLawyer;
use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\CheckRole;
use App\Http\Middleware\IsSuperAdmin;
use App\Http\Middleware\IsAdmin;
use App\Http\Middleware\Authenticate;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Add CORS middleware to handle preflight requests
        $middleware->prepend(HandleCors::class);
        
        // Use custom Authenticate middleware that returns JSON for API routes
        $middleware->alias([
            'auth' => Authenticate::class,
            'lawyer' => EnsureLawyer::class,
            'admin' => IsAdmin::class, // Changed to use IsAdmin for User model with role check
            'role' => CheckRole::class,
            'superadmin' => IsSuperAdmin::class,
            'isadmin' => IsAdmin::class,
            'ensureadmin' => EnsureAdmin::class, // Keep old middleware available if needed
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Handle unauthenticated API requests
        $exceptions->render(function (AuthenticationException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                    'error' => 'Token missing or invalid'
                ], 401);
            }
        });
    })
    ->create();