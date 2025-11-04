<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class LawyerAvailabilitySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all lawyers
        $lawyers = DB::table('lawyers')->get();

        foreach ($lawyers as $lawyer) {
            // Set default availability: Monday to Friday, 9 AM - 6 PM
            $weekdaySchedules = [
                ['day' => 1, 'start' => '09:00', 'end' => '18:00'], // Monday
                ['day' => 2, 'start' => '09:00', 'end' => '18:00'], // Tuesday
                ['day' => 3, 'start' => '09:00', 'end' => '18:00'], // Wednesday
                ['day' => 4, 'start' => '09:00', 'end' => '18:00'], // Thursday
                ['day' => 5, 'start' => '09:00', 'end' => '18:00'], // Friday
            ];

            foreach ($weekdaySchedules as $schedule) {
                // Check if availability already exists
                $exists = DB::table('lawyer_availability')
                    ->where('lawyer_id', $lawyer->id)
                    ->where('day_of_week', $schedule['day'])
                    ->exists();

                if (!$exists) {
                    DB::table('lawyer_availability')->insert([
                        'lawyer_id' => $lawyer->id,
                        'day_of_week' => $schedule['day'],
                        'start_time' => $schedule['start'],
                        'end_time' => $schedule['end'],
                        'is_available' => true,
                        'created_at' => Carbon::now(),
                        'updated_at' => Carbon::now(),
                    ]);
                }
            }

            // Mark weekends as unavailable
            $weekendDays = [0, 6]; // Sunday and Saturday

            foreach ($weekendDays as $day) {
                $exists = DB::table('lawyer_availability')
                    ->where('lawyer_id', $lawyer->id)
                    ->where('day_of_week', $day)
                    ->exists();

                if (!$exists) {
                    DB::table('lawyer_availability')->insert([
                        'lawyer_id' => $lawyer->id,
                        'day_of_week' => $day,
                        'start_time' => '09:00',
                        'end_time' => '18:00',
                        'is_available' => false, // Not available on weekends
                        'created_at' => Carbon::now(),
                        'updated_at' => Carbon::now(),
                    ]);
                }
            }

            $this->command->info("Set availability for lawyer ID: {$lawyer->id}");
        }

        $this->command->info('Lawyer availability seeded successfully!');
    }
}