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
        Schema::create('lawyer_availability', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lawyer_id')->constrained()->onDelete('cascade');
            
            // Day of week availability (0 = Sunday, 6 = Saturday)
            $table->integer('day_of_week'); // 0-6
            $table->time('start_time');
            $table->time('end_time');
            $table->boolean('is_available')->default(true);
            
            $table->timestamps();
            
            // Prevent duplicate entries for same lawyer/day
            $table->unique(['lawyer_id', 'day_of_week']);
        });
        
        // Table for specific date blocks (holidays, vacations, etc.)
        Schema::create('lawyer_unavailable_dates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lawyer_id')->constrained()->onDelete('cascade');
            
            $table->date('unavailable_date');
            $table->string('reason')->nullable(); // Holiday, Vacation, Court Date, etc.
            
            $table->timestamps();
            
            $table->index(['lawyer_id', 'unavailable_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lawyer_unavailable_dates');
        Schema::dropIfExists('lawyer_availability');
    }
};