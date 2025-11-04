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
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('lawyer_id');
            
            // Foreign keys without cascade for SQL Server compatibility
            $table->foreign('user_id')->references('id')->on('users')->onDelete('no action');
            $table->foreign('lawyer_id')->references('id')->on('lawyers')->onDelete('no action');
            
            // Appointment details
            $table->date('appointment_date');
            $table->time('appointment_time');
            $table->integer('duration_minutes')->default(60); // Default 1 hour
            
            // Status tracking
            $table->enum('status', [
                'pending',      // Waiting for lawyer confirmation
                'confirmed',    // Lawyer confirmed
                'cancelled',    // Either party cancelled
                'completed',    // Consultation finished
                'no_show'       // Client didn't show up
            ])->default('pending');
            
            // Payment details
            $table->decimal('consultation_fee', 10, 2);
            $table->enum('payment_status', [
                'unpaid',
                'paid',
                'refunded'
            ])->default('unpaid');
            $table->string('payment_method')->nullable(); // Will use PayMongo later
            $table->string('payment_reference')->nullable();
            
            // Additional info
            $table->text('client_notes')->nullable(); // Client's reason for consultation
            $table->text('lawyer_notes')->nullable(); // Lawyer's internal notes
            $table->text('cancellation_reason')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->foreignId('cancelled_by')->nullable()->constrained('users');
            
            // Meeting details
            $table->string('meeting_type')->default('in-person'); // in-person, video, phone
            $table->string('meeting_link')->nullable(); // For video consultations
            
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['user_id', 'appointment_date']);
            $table->index(['lawyer_id', 'appointment_date']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};