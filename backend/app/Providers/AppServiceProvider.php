<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
// use App\Models\Lawyer;
// use App\Observers\LawyerObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Google services (Auth & Calendar) are configured with graceful degradation
        // They will work when credentials are provided via environment variables:
        // - GOOGLE_CLIENT_ID
        // - GOOGLE_CLIENT_SECRET
        // - GOOGLE_REDIRECT_URI
        // - GOOGLE_AUTH_REDIRECT_URI
        // If credentials are missing, Google features will be disabled automatically

        // Register model observers
        // TEMPORARILY DISABLED: LawyerObserver causes infinite recursion with encrypted casts in PHP 8.3
        // Name sync is already handled in LawyerController::createProfile (lines 224-235)
        // Lawyer::observe(LawyerObserver::class);
    }
}
