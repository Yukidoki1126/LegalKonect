<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        Admin::create([
            'name' => 'Super Admin',
            'email' => 'admin@legalkonect.com',
            'password' => Hash::make('admin123'),
            'is_active' => true,
        ]);

        echo "Admin created successfully!\n";
        echo "Email: admin@legalkonect.com\n";
        echo "Password: admin123\n";
    }
}