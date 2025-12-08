<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\Lawyer;
use App\Observers\LawyerObserver;

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
        // Disable eager loading of Google services during boot
        // This prevents HTTP requests to Google during app initialization
        if (config('app.env') === 'production') {
            // Bind Google services as singletons to prevent premature instantiation
            $this->app->singleton(\App\Services\GoogleCalendarService::class, function () {
                return new \App\Services\GoogleCalendarService();
            });

            $this->app->singleton(\App\Services\GoogleAuthService::class, function () {
                return new \App\Services\GoogleAuthService();
            });
        }

        // Register model observers
        Lawyer::observe(LawyerObserver::class);
    }
}
