<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds payment proof upload and manual payment fields to appointments
     */
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // Payment proof (receipt screenshot uploaded by client)
            $table->string('payment_proof')->nullable()->after('payment_details');
            
            // Payment method used by client (gcash or bank)
            $table->string('payment_method_used')->nullable()->after('payment_proof');
            
            // When the payment proof was uploaded
            $table->timestamp('payment_proof_uploaded_at')->nullable()->after('payment_method_used');
            
            // Lawyer's confirmation of payment (null = pending, true = confirmed, false = rejected)
            $table->boolean('payment_confirmed')->nullable()->after('payment_proof_uploaded_at');
            $table->timestamp('payment_confirmed_at')->nullable()->after('payment_confirmed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn([
                'payment_proof',
                'payment_method_used',
                'payment_proof_uploaded_at',
                'payment_confirmed',
                'payment_confirmed_at'
            ]);
        });
    }
};
