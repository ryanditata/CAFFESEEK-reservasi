<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cafe_tables', function (Blueprint $table) {
            $table->id();

            $table->foreignId('cafe_id')->constrained()->onDelete('cascade');
            $table->unsignedSmallInteger('table_number'); 
            $table->unsignedSmallInteger('capacity'); 
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cafe_tables');
    }
};