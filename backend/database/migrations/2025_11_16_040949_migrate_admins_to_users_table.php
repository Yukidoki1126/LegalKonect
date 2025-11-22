<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Migrate existing admins to users table with admin role
        $admins = DB::table('admins')->get();

        foreach ($admins as $admin) {
            // Check if user with same email already exists
            $existingUser = DB::table('users')->where('email', $admin->email)->first();

            if (!$existingUser) {
                // Create new user from admin
                DB::table('users')->insert([
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'password' => $admin->password,
                    'role' => 'super_admin', // First admin becomes super_admin
                    'email_verified_at' => $admin->email_verified_at ?? now(),
                    'last_login_at' => $admin->last_login_at ?? null,
                    'created_at' => $admin->created_at ?? now(),
                    'updated_at' => $admin->updated_at ?? now(),
                ]);
            } else {
                // Update existing user to admin role
                DB::table('users')
                    ->where('email', $admin->email)
                    ->update([
                        'role' => 'super_admin',
                        'last_login_at' => $admin->last_login_at ?? null,
                    ]);
            }
        }

        // Update existing lawyers to have lawyer role
        DB::table('users')
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                      ->from('lawyers')
                      ->whereColumn('lawyers.user_id', 'users.id');
            })
            ->where('role', 'client') // Only update if still client
            ->update(['role' => 'lawyer']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore admins to admins table
        $adminUsers = DB::table('users')
            ->whereIn('role', ['admin', 'super_admin'])
            ->get();

        foreach ($adminUsers as $user) {
            DB::table('admins')->updateOrInsert(
                ['email' => $user->email],
                [
                    'name' => $user->name,
                    'email' => $user->email,
                    'password' => $user->password,
                    'is_active' => true,
                    'last_login_at' => $user->last_login_at,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ]
            );
        }

        // Reset lawyer users back to client
        DB::table('users')
            ->where('role', 'lawyer')
            ->update(['role' => 'client']);
    }
};
