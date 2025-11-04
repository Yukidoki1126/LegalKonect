<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Appointment;
use App\Models\User;
use App\Models\Lawyer;
use Carbon\Carbon;

class AppointmentSeeder extends Seeder
{
    public function run()
    {
        $users = User::whereDoesntHave('lawyer')->take(5)->get();
        $lawyers = Lawyer::where('status', 'approved')->take(3)->get();

        if ($users->isEmpty() || $lawyers->isEmpty()) {
            $this->command->info('Please create some users and lawyers first.');
            return;
        }

        $statuses = ['pending', 'confirmed', 'completed', 'cancelled'];
        $meetingTypes = ['in-person', 'video', 'phone'];
        $paymentStatuses = ['paid', 'unpaid', 'refunded', 'failed']; // Common payment status values

        // Create 50 sample appointments over the last 30 days
        for ($i = 0; $i < 50; $i++) {
            $user = $users->random();
            $lawyer = $lawyers->random();
            $status = $statuses[array_rand($statuses)];
            $date = Carbon::now()->subDays(rand(0, 30));

            // Determine payment status based on appointment status
            if ($status === 'completed') {
                $paymentStatus = 'paid';
            } elseif ($status === 'cancelled') {
                $paymentStatus = rand(0, 1) ? 'refunded' : 'unpaid';
            } else {
                $paymentStatus = 'unpaid';
            }

            Appointment::create([
                'user_id' => $user->id,
                'lawyer_id' => $lawyer->id,
                'appointment_date' => $date->addDays(rand(1, 30)),
                'appointment_time' => rand(9, 17) . ':00:00',
                'consultation_fee' => rand(500, 3000),
                'status' => $status,
                'meeting_type' => $meetingTypes[array_rand($meetingTypes)],
                'payment_status' => $paymentStatus,
                'payment_method' => $paymentStatus === 'paid' ? ['card', 'gcash'][rand(0, 1)] : null,
                'cancellation_reason' => $status === 'cancelled' ? ['Schedule conflict', 'Personal emergency', 'Found another lawyer', 'No longer needed'][rand(0, 3)] : null,
                'created_at' => $date,
                'updated_at' => $date->addHours(rand(1, 48)),
            ]);
        }

        $this->command->info('50 sample appointments created!');
    }
}