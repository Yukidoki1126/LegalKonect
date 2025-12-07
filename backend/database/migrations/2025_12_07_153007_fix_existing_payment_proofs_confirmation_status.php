<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 1. Alter payment_confirmed column to be nullable
     * 2. Fix existing data: change false to null for pending proofs
     */
    public function up(): void
    {
        // First, alter the column to allow NULL
        Schema::table('appointments', function (Blueprint $table) {
            $table->boolean('payment_confirmed')->nullable()->change();
        });

        // Then update existing data:
        // 1. Appointments with payment proof but payment_confirmed = false should be null (pending)
        DB::table('appointments')
            ->whereNotNull('payment_proof')
            ->where('payment_confirmed', false)
            ->update(['payment_confirmed' => null]);

        // 2. Appointments without payment proof and payment_confirmed = false should also be null
        DB::table('appointments')
            ->whereNull('payment_proof')
            ->where('payment_confirmed', false)
            ->update(['payment_confirmed' => null]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert data back to false
        DB::table('appointments')
            ->whereNull('payment_confirmed')
            ->update(['payment_confirmed' => false]);

        // Revert column to NOT NULL with default false
        Schema::table('appointments', function (Blueprint $table) {
            $table->boolean('payment_confirmed')->default(false)->change();
        });
    }
};
