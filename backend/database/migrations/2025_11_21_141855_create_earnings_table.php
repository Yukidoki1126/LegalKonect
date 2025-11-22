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
        Schema::create('earnings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lawyer_id')->constrained('lawyers')->onDelete('cascade');
            $table->foreignId('appointment_id')->constrained('appointments')->onDelete('cascade');

            // Payment amounts
            $table->decimal('gross_amount', 10, 2); // Total payment from client
            $table->decimal('platform_fee', 10, 2); // Platform commission (20%)
            $table->decimal('net_amount', 10, 2); // Amount lawyer receives (80%)
            $table->decimal('platform_fee_percentage', 5, 2)->default(20.00); // Store the fee % used

            // Status tracking
            $table->enum('status', ['pending', 'completed', 'refunded'])->default('pending');
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();

            // Indexes for performance
            $table->index('lawyer_id');
            $table->index('appointment_id');
            $table->index('status');
            $table->index('completed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('earnings');
    }
};
