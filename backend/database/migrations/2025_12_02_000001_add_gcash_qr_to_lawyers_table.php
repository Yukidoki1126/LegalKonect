<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds GCash QR code field to lawyers table for direct payment
     */
    public function up(): void
    {
        Schema::table('lawyers', function (Blueprint $table) {
            // GCash QR code image path
            $table->string('gcash_qr_code')->nullable()->after('gcash_account_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lawyers', function (Blueprint $table) {
            $table->dropColumn('gcash_qr_code');
        });
    }
};
