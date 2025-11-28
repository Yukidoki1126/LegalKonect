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
            // Index for getUserAppointments query - filtering by user_id and status
            $table->index(['user_id', 'status'], 'idx_appointments_user_status');

            // Index for ordering by created_at (upcoming appointments)
            $table->index(['user_id', 'created_at'], 'idx_appointments_user_created');

            // Index for ordering by appointment_date and time (past appointments)
            $table->index(['user_id', 'appointment_date', 'appointment_time'], 'idx_appointments_user_date_time');

            // Index for updated_at (cancelled appointments)
            $table->index(['user_id', 'updated_at'], 'idx_appointments_user_updated');

            // Index for lawyer queries
            $table->index(['lawyer_id', 'status'], 'idx_appointments_lawyer_status');
            $table->index(['lawyer_id', 'appointment_date'], 'idx_appointments_lawyer_date');
        });

        Schema::table('lawyer_schedules', function (Blueprint $table) {
            // Index for finding schedules by lawyer and day
            $table->index(['lawyer_id', 'day_of_week', 'is_active'], 'idx_lawyer_schedules_lookup');
        });

        Schema::table('lawyer_unavailable_dates', function (Blueprint $table) {
            // Index for checking blocked dates
            $table->index(['lawyer_id', 'unavailable_date'], 'idx_lawyer_unavailable_lookup');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex('idx_appointments_user_status');
            $table->dropIndex('idx_appointments_user_created');
            $table->dropIndex('idx_appointments_user_date_time');
            $table->dropIndex('idx_appointments_user_updated');
            $table->dropIndex('idx_appointments_lawyer_status');
            $table->dropIndex('idx_appointments_lawyer_date');
        });

        Schema::table('lawyer_schedules', function (Blueprint $table) {
            $table->dropIndex('idx_lawyer_schedules_lookup');
        });

        Schema::table('lawyer_unavailable_dates', function (Blueprint $table) {
            $table->dropIndex('idx_lawyer_unavailable_lookup');
        });
    }
};
