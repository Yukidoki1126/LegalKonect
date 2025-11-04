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
        Schema::create('cases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('lawyer_id')->constrained()->onDelete('no action');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('case_type')->nullable(); // e.g., Civil, Criminal, Family, Labor, etc.
            $table->enum('status', ['pending', 'ongoing', 'closed'])->default('pending');
            $table->text('lawyer_updates')->nullable(); // Updates from lawyer
            $table->text('resolution_summary')->nullable(); // Final outcome
            $table->timestamp('started_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cases');
    }
};
