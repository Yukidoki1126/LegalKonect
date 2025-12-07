<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        // Check if admin already exists
        $existingUser = User::where('email', 'admin@legalkonect.com')->first();

        if ($existingUser) {
            echo "Admin user already exists!\n";
            return;
        }

        // Create user record first
        $user = User::create([
            'name' => 'Admin',
            'email' => 'admin@legalkonect.com',
            'password' => Hash::make('Admin@12345'),
            'role' => 'admin',
            'email_verified_at' => now()
        ]);

        // Create admin record
        Admin::create([
            'user_id' => $user->id,
            'permissions' => json_encode(['all'])
        ]);

        echo "Admin created successfully!\n";
        echo "Email: admin@legalkonect.com\n";
        echo "Password: Admin@12345\n";
    }
}