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
            // Drop refund-related columns (check if they exist first)
            $columns = ['refund_id', 'refund_status', 'refund_amount', 'refund_requested_at',
                       'refund_completed_at', 'refund_reason', 'refund_notes'];

            foreach ($columns as $column) {
                if (Schema::hasColumn('appointments', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // Re-add refund columns if needed to rollback
            $table->string('refund_id')->nullable();
            $table->string('refund_status')->nullable();
            $table->decimal('refund_amount', 10, 2)->nullable();
            $table->timestamp('refund_requested_at')->nullable();
            $table->timestamp('refund_completed_at')->nullable();
            $table->text('refund_reason')->nullable();
            $table->text('refund_notes')->nullable();
        });
    }
};
