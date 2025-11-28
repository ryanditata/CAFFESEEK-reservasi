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
        Schema::create('cafes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->string('location');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('video_url')->nullable();
            $table->json('operational_hours')->nullable();
            $table->boolean('has_colokan')->default(false);
            $table->boolean('has_wifi')->default(false);
            $table->boolean('has_indoor')->default(false);
            $table->boolean('has_outdoor')->default(false);
            $table->boolean('has_smoking_area')->default(false);
            $table->boolean('meeting_room_available')->default(false);
            $table->unsignedInteger('meeting_room_capacity')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cafes');
    }
};

