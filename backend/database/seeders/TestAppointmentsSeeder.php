<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Appointment;
use App\Models\User;
use App\Models\Lawyer;
use Carbon\Carbon;

class TestAppointmentsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Find Henry Lawyerr
        $henryUser = User::where('email', 'kenvergel1103@gmail.com')->first();

        if (!$henryUser) {
            $this->command->error('Henry Lawyerr user not found!');
            return;
        }

        $lawyer = Lawyer::where('user_id', $henryUser->id)->first();

        if (!$lawyer) {
            $this->command->error('Henry Lawyerr lawyer profile not found!');
            return;
        }

        // Find Ken Test client
        $kenTest = User::where('email', 'kenvergel26@gmail.com')->first();

        if (!$kenTest) {
            $this->command->error('Ken Test user not found!');
            return;
        }

        // Create multiple appointments on the same day (December 1, 2025)
        $testDate = Carbon::create(2025, 12, 1);

        $appointments = [
            [
                'time' => '09:00:00',
                'client_name' => 'Ken Test',
                'user_id' => $kenTest->id,
            ],
            [
                'time' => '11:00:00',
                'client_name' => 'Maria Santos',
                'user_id' => $kenTest->id, // Using Ken's ID for simplicity
            ],
            [
                'time' => '14:00:00',
                'client_name' => 'Juan Dela Cruz',
                'user_id' => $kenTest->id,
            ],
            [
                'time' => '16:00:00',
                'client_name' => 'Anna Reyes',
                'user_id' => $kenTest->id,
            ],
        ];

        foreach ($appointments as $apt) {
            Appointment::create([
                'user_id' => $apt['user_id'],
                'lawyer_id' => $lawyer->id,
                'appointment_date' => $testDate->toDateString(),
                'appointment_time' => $apt['time'],
                'duration_minutes' => 60,
                'status' => 'confirmed',
                'consultation_fee' => $lawyer->hourly_rate ?? 500,
                'payment_status' => 'paid',
                'payment_method' => 'card',
                'payment_reference' => 'pi_test_' . uniqid(),
                'client_notes' => 'Test appointment for bulk reschedule feature',
                'meeting_type' => 'online',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->command->info("Created appointment for {$apt['client_name']} at {$apt['time']}");
        }

        // Also create appointments on another day (December 3, 2025) for additional testing
        $testDate2 = Carbon::create(2025, 12, 3);

        $appointments2 = [
            [
                'time' => '10:00:00',
                'client_name' => 'Pedro Garcia',
                'user_id' => $kenTest->id,
            ],
            [
                'time' => '13:00:00',
                'client_name' => 'Lisa Tan',
                'user_id' => $kenTest->id,
            ],
            [
                'time' => '15:00:00',
                'client_name' => 'Marco Flores',
                'user_id' => $kenTest->id,
            ],
        ];

        foreach ($appointments2 as $apt) {
            Appointment::create([
                'user_id' => $apt['user_id'],
                'lawyer_id' => $lawyer->id,
                'appointment_date' => $testDate2->toDateString(),
                'appointment_time' => $apt['time'],
                'duration_minutes' => 60,
                'status' => 'confirmed',
                'consultation_fee' => $lawyer->hourly_rate ?? 500,
                'payment_status' => 'paid',
                'payment_method' => 'card',
                'payment_reference' => 'pi_test_' . uniqid(),
                'client_notes' => 'Test appointment for bulk reschedule feature',
                'meeting_type' => 'online',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->command->info("Created appointment for {$apt['client_name']} at {$apt['time']}");
        }

        $this->command->info('✅ Successfully created test appointments for bulk reschedule!');
        $this->command->info('   - December 1, 2025: 4 appointments');
        $this->command->info('   - December 3, 2025: 3 appointments');
    }
}
