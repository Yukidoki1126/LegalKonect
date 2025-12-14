<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    
    public function run(): void
    {
       
        $this->call([
            SpecializationsTableSeeder::class,
            LawyersTableSeeder::class,
            LawyerAvailabilitySeeder::class,
            FaqSeeder::class,
            SuperAdminSeeder::class,
            AdminTableSeeder::class,  // Add this - creates admin in admins table
            AppointmentSeeder::class,
            TestAppointmentsSeeder::class,
        ]);
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);
    }
}
