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
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'google_id')) {
                $table->string('google_id')->nullable()->after('email');
            }
            if (!Schema::hasColumn('users', 'avatar')) {
                $table->string('avatar')->nullable()->after('profile_picture');
            }
            if (!Schema::hasColumn('users', 'auth_provider')) {
                $table->string('auth_provider')->default('local')->after('avatar');
            }
        });

        // Create unique index on google_id (MySQL compatible - allows multiple NULLs)
        if (!DB::select("SHOW INDEXES FROM users WHERE Key_name = 'users_google_id_unique'")) {
            DB::statement('CREATE UNIQUE INDEX users_google_id_unique ON users (google_id)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the unique index first
        DB::statement('DROP INDEX IF EXISTS users_google_id_unique ON users');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['google_id', 'avatar', 'auth_provider']);
        });
    }
};
