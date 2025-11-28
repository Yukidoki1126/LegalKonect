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
        Schema::table('lawyer_availability', function (Blueprint $table) {
            $table->integer('daily_appointment_limit')->nullable()->after('end_time')
                ->comment('Maximum number of appointments allowed per day for this day of week. Null means unlimited.');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lawyer_availability', function (Blueprint $table) {
            $table->dropColumn('daily_appointment_limit');
        });
    }
};
