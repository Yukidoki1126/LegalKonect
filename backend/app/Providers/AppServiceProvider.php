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
        // Register model observers
        Lawyer::observe(LawyerObserver::class);
    }
}
