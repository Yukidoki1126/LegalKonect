<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SpecializationsTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $specializations = [
            [
                'name' => 'Family Law',
                'description' => 'Divorce, child custody, adoption, marital property, domestic relations',
            ],
            [
                'name' => 'Criminal Law',
                'description' => 'Criminal defense, white-collar crime, fraud, theft, assault, drug cases',
            ],
            [
                'name' => 'Corporate Law',
                'description' => 'Business formation, mergers & acquisitions, corporate governance, securities',
            ],
            [
                'name' => 'Labor Law',
                'description' => 'Employment disputes, unfair dismissal, workplace discrimination, labor contracts',
            ],
            [
                'name' => 'Real Estate Law',
                'description' => 'Property transactions, land disputes, title transfers, real estate development',
            ],
            [
                'name' => 'Immigration Law',
                'description' => 'Visa applications, citizenship, deportation defense, work permits',
            ],
        ];

        foreach ($specializations as $specialization) {
            // Check if specialization already exists by name
            $exists = DB::table('specializations')
                ->where('name', $specialization['name'])
                ->exists();

            if (!$exists) {
                DB::table('specializations')->insert([
                    'name' => $specialization['name'],
                    'description' => $specialization['description'],
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
            }
        }

        $this->command->info('Specializations seeded successfully!');
    }
}