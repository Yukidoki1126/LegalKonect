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
        Schema::create('payouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lawyer_id')->constrained('lawyers')->onDelete('cascade');

            // Payout details
            $table->decimal('amount', 10, 2);
            $table->enum('payout_method', ['gcash', 'bank']);
            $table->string('payout_account_number'); // GCash number or bank account number
            $table->string('payout_account_name');
            $table->string('bank_name')->nullable(); // Only for bank transfers

            // Status tracking
            $table->enum('status', ['pending', 'approved', 'processing', 'paid', 'rejected'])->default('pending');
            $table->timestamp('requested_at')->useCurrent();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('rejected_at')->nullable();

            // Admin processing
            $table->foreignId('processed_by')->nullable()->constrained('users')->onDelete('no action'); // Admin who processed
            $table->text('admin_notes')->nullable();
            $table->text('rejection_reason')->nullable();

            // Transaction reference (optional - for record keeping)
            $table->string('transaction_reference')->nullable();

            $table->timestamps();

            // Indexes
            $table->index('lawyer_id');
            $table->index('status');
            $table->index('requested_at');
            $table->index('paid_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payouts');
    }
};
