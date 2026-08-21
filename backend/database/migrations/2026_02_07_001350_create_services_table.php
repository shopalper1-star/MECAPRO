<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('name');         // e.g., "Oil Change"
            $table->string('zone');         // Critical for the Visualizer (engine, wheels, etc.)
            $table->decimal('price', 8, 2)->default(0); 
            $table->timestamps();
        });

        Schema::table('repairs', function (Blueprint $table) {
            $table->foreignId('service_id')->nullable()->constrained()->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
