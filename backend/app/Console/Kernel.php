<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Send appointment reminders every day at 9:00 AM
        $schedule->command('appointments:send-reminders')
                 ->dailyAt('09:00')
                 ->timezone('Asia/Manila')
                 ->appendOutputTo(storage_path('logs/appointment-reminders.log'));
        
        // Alternative: Run every hour during business hours (for testing)
        // $schedule->command('appointments:send-reminders')
        //          ->hourly()
        //          ->between('8:00', '18:00')
        //          ->timezone('Asia/Manila');
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}