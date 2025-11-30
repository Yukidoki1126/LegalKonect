<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->unsignedBigInteger('specialization_id')->nullable();
            $table->unsignedBigInteger('confirmed_specialization_id')->nullable();
            $table->timestamp('specialization_confirmed_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn(['specialization_id', 'confirmed_specialization_id', 'specialization_confirmed_at']);
        });
    }
};
