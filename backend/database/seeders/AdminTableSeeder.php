<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Admin;
use Illuminate\Support\Facades\Hash;

class AdminTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create default super admin in admins table
        Admin::updateOrCreate(
            ['email' => 'admin@legalkonect.com'],
            [
                'name' => 'Super Admin',
                'email' => 'admin@legalkonect.com',
                'password' => Hash::make('admin123'),
                'role' => Admin::ROLE_SUPER_ADMIN,
                'is_active' => true,
                'last_login_at' => null,
            ]
        );

        $this->command->info('✓ Admin account created in admins table!');
        $this->command->info('Email: admin@legalkonect.com');
        $this->command->info('Password: admin123');
        $this->command->warn('⚠ IMPORTANT: Change this password after first login!');
    }
}
