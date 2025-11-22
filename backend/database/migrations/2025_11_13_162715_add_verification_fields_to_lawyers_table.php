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
            // Verification status
            $table->enum('verification_status', ['pending', 'verified', 'rejected'])->default('pending')->after('google_calendar_connected');

            // Lawyer credentials
            $table->string('ibp_number', 50)->nullable()->after('verification_status');
            $table->string('roll_of_attorneys_number', 50)->nullable()->after('ibp_number');
            $table->string('prc_license_number', 50)->nullable()->after('roll_of_attorneys_number');

            // Document paths (JSON array of file paths)
            $table->json('verification_documents')->nullable()->after('prc_license_number');

            // Admin verification details
            $table->text('verification_notes')->nullable()->after('verification_documents');
            $table->timestamp('verified_at')->nullable()->after('verification_notes');
            $table->unsignedBigInteger('verified_by')->nullable()->after('verified_at');

            // Foreign key for admin who verified (NO ACTION to avoid cascade conflicts)
            $table->foreign('verified_by')->references('id')->on('users')->onDelete('no action')->onUpdate('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lawyers', function (Blueprint $table) {
            $table->dropForeign(['verified_by']);
            $table->dropColumn([
                'verification_status',
                'ibp_number',
                'roll_of_attorneys_number',
                'prc_license_number',
                'verification_documents',
                'verification_notes',
                'verified_at',
                'verified_by'
            ]);
        });
    }
};
