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

        // Create unique index on google_id (compatible with MySQL and PostgreSQL)
        $connection = DB::getDriverName();
        if ($connection === 'pgsql') {
            $indexExists = DB::select("SELECT 1 FROM pg_indexes WHERE tablename = 'users' AND indexname = 'users_google_id_unique'");
            if (!$indexExists) {
                DB::statement('CREATE UNIQUE INDEX users_google_id_unique ON users (google_id)');
            }
        } else {
            $indexExists = DB::select("SHOW INDEXES FROM users WHERE Key_name = 'users_google_id_unique'");
            if (!$indexExists) {
                DB::statement('CREATE UNIQUE INDEX users_google_id_unique ON users (google_id)');
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the unique index first (compatible with MySQL and PostgreSQL)
        $connection = DB::getDriverName();
        if ($connection === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS users_google_id_unique');
        } else {
            DB::statement('DROP INDEX IF EXISTS users_google_id_unique ON users');
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['google_id', 'avatar', 'auth_provider']);
        });
    }
};
