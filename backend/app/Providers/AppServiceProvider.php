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
        // TEMPORARY: Disable Google services in production until app is deployed
        // TODO: Re-enable after successful deployment

        // Register model observers
        Lawyer::observe(LawyerObserver::class);
    }
}
