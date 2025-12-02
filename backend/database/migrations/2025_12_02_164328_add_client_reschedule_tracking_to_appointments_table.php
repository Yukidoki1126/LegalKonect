<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // Track who requested the reschedule: 'lawyer' or 'client'
            $table->string('reschedule_requested_by')->nullable()->after('reschedule_responded_at');
            // Track if client has used their one-time reschedule
            $table->boolean('client_reschedule_used')->default(false)->after('reschedule_requested_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn(['reschedule_requested_by', 'client_reschedule_used']);
        });
    }
};
