<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create default super admin
        User::updateOrCreate(
            ['email' => 'admin@legalkonect.com'],
            [
                'name' => 'Super Admin',
                'email' => 'admin@legalkonect.com',
                'password' => Hash::make('admin123'),
                'role' => User::ROLE_SUPER_ADMIN,
                'email_verified_at' => now(),
                'status' => 'active',
            ]
        );

        $this->command->info('Super Admin created successfully!');
        $this->command->info('Email: admin@legalkonect.com');
        $this->command->info('Password: admin123');
        $this->command->warn('IMPORTANT: Please change the password after first login!');
    }
}
