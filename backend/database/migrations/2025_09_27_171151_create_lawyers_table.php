<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('lawyers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->text('bio')->nullable();
            $table->string('license_number', 50)->unique();
            $table->integer('years_experience')->default(0);
            $table->decimal('hourly_rate', 8, 2);
            $table->string('office_address', 500);
            $table->decimal('office_latitude', 10, 8);
            $table->decimal('office_longitude', 11, 8);
            $table->string('office_phone', 20)->nullable();
            $table->json('office_hours')->nullable();
            $table->string('profile_photo')->nullable();
            $table->enum('status', ['pending', 'approved', 'suspended'])->default('pending');
            $table->decimal('rating', 3, 2)->default(0.00);
            $table->integer('total_reviews')->default(0);
            $table->boolean('is_available')->default(true);
            $table->timestamps();
            
            // Index for location-based queries
            $table->index(['office_latitude', 'office_longitude']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('lawyers');
    }
};