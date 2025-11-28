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
            $table->string('reschedule_status')->nullable()->after('status'); // null, pending, accepted, declined
            $table->text('reschedule_reason')->nullable()->after('reschedule_status');
            $table->dateTime('original_date')->nullable()->after('reschedule_reason');
            $table->dateTime('proposed_date')->nullable()->after('original_date');
            $table->dateTime('reschedule_requested_at')->nullable()->after('proposed_date');
            $table->dateTime('reschedule_responded_at')->nullable()->after('reschedule_requested_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn([
                'reschedule_status',
                'reschedule_reason',
                'original_date',
                'proposed_date',
                'reschedule_requested_at',
                'reschedule_responded_at'
            ]);
        });
    }
};
