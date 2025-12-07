<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        // Check if admin already exists
        $existingAdmin = Admin::where('email', 'admin@legalkonect.com')->first();

        if ($existingAdmin) {
            echo "Admin user already exists!\n";
            return;
        }

        // Create admin record directly (standalone table)
        Admin::create([
            'name' => 'Super Admin',
            'email' => 'admin@legalkonect.com',
            'password' => Hash::make('Admin@12345'),
            'is_active' => true,
        ]);

        echo "Admin created successfully!\n";
        echo "Email: admin@legalkonect.com\n";
        echo "Password: Admin@12345\n";
    }
}