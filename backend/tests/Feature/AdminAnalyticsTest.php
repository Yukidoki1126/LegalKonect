<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AdminAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_stats_is_period_scoped()
    {
        $this->withoutMiddleware();

        // Create a client and lawyer user
        $clientId = DB::table('users')->insertGetId([
            'name' => 'Client One',
            'email' => 'client1@example.test',
            'password' => bcrypt('password')
        ]);

        $lawyerUserId = DB::table('users')->insertGetId([
            'name' => 'Lawyer One',
            'email' => 'lawyer1@example.test',
            'password' => bcrypt('password')
        ]);

        $lawyerId = DB::table('lawyers')->insertGetId([
            'user_id' => $lawyerUserId,
            'first_name' => 'Law',
            'last_name' => 'Yer',
            'license_number' => 'LN-100',
            'years_experience' => 3,
            'hourly_rate' => 500,
            'office_address' => '123 Test St',
            'office_latitude' => 0.0,
            'office_longitude' => 0.0,
            'status' => 'approved',
            'profile_photo' => null,
            'rating' => 4.5
        ]);

        // Old appointment (outside 30-day window)
        $old = now()->subDays(40);
        DB::table('appointments')->insert([
            'user_id' => $clientId,
            'lawyer_id' => $lawyerId,
            'appointment_date' => $old->toDateString(),
            'appointment_time' => '10:00:00',
            'duration_minutes' => 60,
            'status' => 'completed',
            'consultation_fee' => 100.00,
            'payment_status' => 'paid',
            'meeting_type' => 'in-person',
            'created_at' => $old,
            'updated_at' => $old
        ]);

        // 4 recent appointments (inside 30-day window)
        for ($i = 0; $i < 4; $i++) {
            DB::table('appointments')->insert([
                'user_id' => $clientId,
                'lawyer_id' => $lawyerId,
                'appointment_date' => now()->toDateString(),
                'appointment_time' => '12:00:00',
                'duration_minutes' => 60,
                'status' => 'confirmed',
                'consultation_fee' => 150.00 + $i,
                'payment_status' => 'paid',
                'meeting_type' => 'video',
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        $response = $this->getJson('/api/admin/dashboard/stats?days=30');

        $response->assertStatus(200);
        $json = $response->json();

        // It should only count the 4 recent appointments
        $this->assertEquals(4, $json['total_appointments']);
    }

    public function test_avg_fee_by_specialization_aggregates_by_distinct_appointments()
    {
        $this->withoutMiddleware();
        // Create specialization and lawyer
        $specId = DB::table('specializations')->insertGetId([
            'name' => 'Corporate',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $uId = DB::table('users')->insertGetId([
            'name' => 'Client Two',
            'email' => 'client2@example.test',
            'password' => bcrypt('password')
        ]);

        $lawyerUserId = DB::table('users')->insertGetId([
            'name' => 'Lawyer Two',
            'email' => 'lawyer2@example.test',
            'password' => bcrypt('password')
        ]);

        $lawyerId = DB::table('lawyers')->insertGetId([
            'user_id' => $lawyerUserId,
            'first_name' => 'Law',
            'last_name' => 'Spec',
            'license_number' => 'LN-101',
            'years_experience' => 2,
            'hourly_rate' => 500,
            'office_address' => '456 Spec St',
            'office_latitude' => 0.0,
            'office_longitude' => 0.0,
            'status' => 'approved',
            'profile_photo' => null,
            'rating' => 4.0
        ]);

        // attach specialization
        DB::table('lawyer_specializations')->insert([
            'lawyer_id' => $lawyerId,
            'specialization_id' => $specId,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // two appointments for that lawyer with fees 100 and 200 - average should be 150
        DB::table('appointments')->insert([
            'user_id' => $uId,
            'lawyer_id' => $lawyerId,
            'appointment_date' => now()->toDateString(),
            'appointment_time' => '09:00:00',
            'duration_minutes' => 60,
            'status' => 'completed',
            'consultation_fee' => 100.00,
            'payment_status' => 'paid',
            'meeting_type' => 'in-person',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        DB::table('appointments')->insert([
            'user_id' => $uId,
            'lawyer_id' => $lawyerId,
            'appointment_date' => now()->toDateString(),
            'appointment_time' => '11:00:00',
            'duration_minutes' => 60,
            'status' => 'completed',
            'consultation_fee' => 200.00,
            'payment_status' => 'paid',
            'meeting_type' => 'in-person',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $response = $this->getJson('/api/admin/descriptive-analytics?days=30');
        $response->assertStatus(200);

        $data = $response->json();

        // Find our specialization in the avg_fee_by_specialization list
        $found = null;
        foreach ($data['avg_fee_by_specialization'] as $row) {
            if ($row['id'] == $specId || $row['name'] === 'Corporate') {
                $found = $row;
                break;
            }
        }

        $this->assertNotNull($found, 'Specialization data not returned');
        // Because two appointments at 100 and 200 => avg 150
        $this->assertEquals(150.0, round((float)$found['avg_fee'], 1));
    }
}
