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
        // Update all existing approved lawyers to have verified status
        DB::table('lawyers')
            ->where('status', 'approved')
            ->where(function($query) {
                $query->whereNull('verification_status')
                      ->orWhere('verification_status', 'pending');
            })
            ->update([
                'verification_status' => 'verified',
                'verified_at' => now(),
                'verification_notes' => 'Auto-verified: Existing approved lawyer before verification system implementation'
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert the changes
        DB::table('lawyers')
            ->where('verification_notes', 'Auto-verified: Existing approved lawyer before verification system implementation')
            ->update([
                'verification_status' => 'pending',
                'verified_at' => null,
                'verification_notes' => null
            ]);
    }
};
