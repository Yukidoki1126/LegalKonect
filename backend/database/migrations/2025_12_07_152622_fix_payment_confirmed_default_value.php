<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Fix payment_confirmed default value - change false to null for appointments
     * without payment proof (so they don't appear as rejected)
     */
    public function up(): void
    {
        // Set payment_confirmed to null for appointments that:
        // 1. Have payment_confirmed = false
        // 2. Don't have payment_proof uploaded
        // This ensures appointments without proof don't show as "rejected"
        DB::table('appointments')
            ->where('payment_confirmed', false)
            ->whereNull('payment_proof')
            ->update(['payment_confirmed' => null]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to false for appointments without payment proof
        DB::table('appointments')
            ->whereNull('payment_confirmed')
            ->whereNull('payment_proof')
            ->update(['payment_confirmed' => false]);
    }
};
