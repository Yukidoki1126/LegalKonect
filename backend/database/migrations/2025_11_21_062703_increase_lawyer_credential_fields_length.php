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
        // First, update any NULL values in ibp_number to a default value
        DB::statement("UPDATE lawyers SET ibp_number = 'UNKNOWN' WHERE ibp_number IS NULL");

        Schema::table('lawyers', function (Blueprint $table) {
            // Increase column sizes to accommodate encrypted values
            // Encrypted strings are typically 200+ characters
            $table->string('ibp_number', 500)->change();
            $table->string('roll_of_attorneys_number', 500)->nullable()->change();
            $table->string('prc_license_number', 500)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lawyers', function (Blueprint $table) {
            // Revert to original sizes
            $table->string('ibp_number', 50)->change();
            $table->string('roll_of_attorneys_number', 50)->nullable()->change();
            $table->string('prc_license_number', 50)->nullable()->change();
        });
    }
};
