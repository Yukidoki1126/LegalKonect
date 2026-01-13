<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Appointment;
use Carbon\Carbon;
use Illuminate\Support\Facades\Mail;
use App\Mail\PaymentReminderMail;
use App\Mail\PaymentFinalWarningMail;
use App\Mail\AppointmentAutoCancelledMail;

class ProcessUnpaidAppointments extends Command
{
    protected $signature = 'appointments:process-unpaid';
    protected $description = 'Send payment reminders and auto-cancel unpaid appointments 24 hours before scheduled time';

    public function handle()
    {
        $this->info('Processing unpaid appointments...');

        $now = Carbon::now();
        $in48Hours = $now->copy()->addHours(48);
        $in24Hours = $now->copy()->addHours(24);

        // Find all confirmed appointments that are unpaid
        $unpaidAppointments = Appointment::where('status', 'confirmed')
            ->where('payment_status', '!=', 'paid')
            ->get();

        $reminders48h = 0;
        $reminders24h = 0;
        $cancelled = 0;

        foreach ($unpaidAppointments as $appointment) {
            try {
                $appointmentDateTime = Carbon::parse(
                    $appointment->appointment_date . ' ' . $appointment->appointment_time
                );

                // Auto-cancel if less than 24 hours and still unpaid
                if ($appointmentDateTime->lessThanOrEqualTo($in24Hours)) {
                    $appointment->status = 'cancelled';
                    $appointment->cancellation_reason = 'Automatically cancelled due to unpaid reservation fee';
                    $appointment->save();

                    // Send cancellation email to client
                    Mail::to($appointment->user->email)->send(
                        new AppointmentAutoCancelledMail($appointment)
                    );

                    $cancelled++;
                    $this->info("Cancelled appointment #{$appointment->id} for {$appointment->user->name}");
                }
                // Send final warning at 24-48 hours
                elseif ($appointmentDateTime->lessThanOrEqualTo($in48Hours) && 
                        $appointmentDateTime->greaterThan($in24Hours)) {
                    
                    // Only send if we haven't sent recently (check last 12 hours)
                    $lastSent = $appointment->updated_at;
                    if ($lastSent->diffInHours($now) >= 12) {
                        Mail::to($appointment->user->email)->send(
                            new PaymentFinalWarningMail($appointment)
                        );
                        
                        $appointment->touch(); // Update timestamp to track last reminder
                        $reminders24h++;
                        $this->info("Sent 24h warning to {$appointment->user->email}");
                    }
                }
                // Send first reminder at 48-72 hours
                elseif ($appointmentDateTime->lessThanOrEqualTo($in48Hours->copy()->addHours(24)) && 
                        $appointmentDateTime->greaterThan($in48Hours)) {
                    
                    // Only send if we haven't sent recently (check last 12 hours)
                    $lastSent = $appointment->updated_at;
                    if ($lastSent->diffInHours($now) >= 12) {
                        Mail::to($appointment->user->email)->send(
                            new PaymentReminderMail($appointment)
                        );
                        
                        $appointment->touch();
                        $reminders48h++;
                        $this->info("Sent 48h reminder to {$appointment->user->email}");
                    }
                }

            } catch (\Exception $e) {
                $this->error("Error processing appointment #{$appointment->id}: " . $e->getMessage());
            }
        }

        $this->info("Summary:");
        $this->info("- 48h reminders sent: {$reminders48h}");
        $this->info("- 24h warnings sent: {$reminders24h}");
        $this->info("- Appointments cancelled: {$cancelled}");
        
        return Command::SUCCESS;
    }
}
