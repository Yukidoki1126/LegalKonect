<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;
use App\Http\Middleware\EnsureLawyer;
use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\CheckRole;
use App\Http\Middleware\IsSuperAdmin;
use App\Http\Middleware\IsAdmin;
use App\Http\Middleware\TrustProxies;
use App\Http\Middleware\ForceHttps;
use App\Http\Middleware\HandleCors;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Trust proxies for Railway deployment
        $middleware->trustProxies(at: '*');

        // Handle CORS for API requests
        $middleware->append(HandleCors::class);

        // Force HTTPS in production
        $middleware->append(ForceHttps::class);

        // Register custom middleware aliases
        $middleware->alias([
            'lawyer' => EnsureLawyer::class,
            'admin' => EnsureAdmin::class,
            'role' => CheckRole::class,
            'superadmin' => IsSuperAdmin::class,
            'isadmin' => IsAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Handle unauthenticated API requests
        $exceptions->render(function (AuthenticationException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'message' => 'Unauthenticated.'
                ], 401);
            }
        });
    })
    ->create();