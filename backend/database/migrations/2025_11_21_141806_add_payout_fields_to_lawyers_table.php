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
        Schema::table('lawyers', function (Blueprint $table) {
            // GCash payout information
            $table->string('gcash_number')->nullable()->after('verification_notes');
            $table->string('gcash_account_name')->nullable()->after('gcash_number');

            // Bank payout information
            $table->string('bank_name')->nullable()->after('gcash_account_name');
            $table->string('bank_account_number')->nullable()->after('bank_name');
            $table->string('bank_account_name')->nullable()->after('bank_account_number');

            // Preferred payout method
            $table->enum('preferred_payout_method', ['gcash', 'bank'])->default('gcash')->after('bank_account_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lawyers', function (Blueprint $table) {
            $table->dropColumn([
                'gcash_number',
                'gcash_account_name',
                'bank_name',
                'bank_account_number',
                'bank_account_name',
                'preferred_payout_method'
            ]);
        });
    }
};
