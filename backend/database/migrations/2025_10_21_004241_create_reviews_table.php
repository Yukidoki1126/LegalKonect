<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('no action');
            $table->foreignId('lawyer_id')->constrained()->onDelete('no action');
            $table->foreignId('appointment_id')->constrained()->onDelete('no action');
            $table->integer('rating'); // 1-5 stars
            $table->text('comment');
            $table->boolean('is_approved')->default(false); // Admin approval
            $table->timestamps();
            
            // Ensure one review per appointment
            $table->unique('appointment_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('reviews');
    }
};