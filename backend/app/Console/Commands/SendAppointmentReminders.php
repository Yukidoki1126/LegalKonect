<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Appointment;
use App\Mail\AppointmentReminder;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class SendAppointmentReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
   protected $signature = 'appointments:send-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send email reminders for appointments happening tomorrow';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('Starting to send appointment reminders...');
        
        // Get tomorrow's date
        $tomorrow = Carbon::tomorrow()->toDateString();
        
        // Find all confirmed appointments for tomorrow that haven't received reminders
        $appointments = Appointment::with(['user', 'lawyer'])
            ->where('appointment_date', $tomorrow)
            ->where('status', 'confirmed')
            ->where('payment_status', 'paid')
            ->where(function($query) {
                $query->where('reminder_sent', false)
                      ->orWhereNull('reminder_sent');
            })
            ->get();
        
        if ($appointments->count() === 0) {
            $this->info('No appointments found for tomorrow that need reminders.');
            return Command::SUCCESS;
        }
        
        $this->info("Found {$appointments->count()} appointment(s) for tomorrow.");
        
        $successCount = 0;
        $failCount = 0;
        
        foreach ($appointments as $appointment) {
            try {
                // Send the reminder email
                Mail::to($appointment->user->email)->send(new AppointmentReminder($appointment));
                
                // Mark reminder as sent
                $appointment->reminder_sent = true;
                $appointment->save();
                
                $successCount++;
                
                $this->info("✓ Reminder sent to {$appointment->user->email} for appointment ID: {$appointment->id}");
                
                // Log the success
                Log::info('Appointment reminder sent', [
                    'appointment_id' => $appointment->id,
                    'user_email' => $appointment->user->email,
                    'appointment_date' => $appointment->appointment_date,
                    'appointment_time' => $appointment->appointment_time
                ]);
                
            } catch (\Exception $e) {
                $failCount++;
                
                $this->error("✗ Failed to send reminder for appointment ID: {$appointment->id}");
                $this->error("  Error: " . $e->getMessage());
                
                // Log the error
                Log::error('Failed to send appointment reminder', [
                    'appointment_id' => $appointment->id,
                    'user_email' => $appointment->user->email,
                    'error' => $e->getMessage()
                ]);
            }
        }
        
        $this->info('');
        $this->info('Reminder sending completed!');
        $this->info("✓ Successfully sent: {$successCount}");
        
        if ($failCount > 0) {
            $this->warn("✗ Failed: {$failCount}");
        }
        
        return Command::SUCCESS;
    }
}