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
            $table->string('refund_id')->nullable()->after('payment_reference');
            $table->enum('refund_status', ['pending', 'processing', 'completed', 'failed'])->nullable()->after('refund_id');
            $table->decimal('refund_amount', 10, 2)->nullable()->after('refund_status');
            $table->timestamp('refund_requested_at')->nullable()->after('refund_amount');
            $table->timestamp('refund_completed_at')->nullable()->after('refund_requested_at');
            $table->text('refund_reason')->nullable()->after('refund_completed_at');
            $table->text('refund_notes')->nullable()->after('refund_reason');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn([
                'refund_id',
                'refund_status',
                'refund_amount',
                'refund_requested_at',
                'refund_completed_at',
                'refund_reason',
                'refund_notes'
            ]);
        });
    }
};
