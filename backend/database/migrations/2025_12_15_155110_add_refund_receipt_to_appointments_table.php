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
            $table->string('refund_receipt')->nullable()->after('payment_confirmed_at');
            $table->timestamp('refund_processed_at')->nullable()->after('refund_receipt');
            $table->text('refund_notes')->nullable()->after('refund_processed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn(['refund_receipt', 'refund_processed_at', 'refund_notes']);
        });
    }
};
