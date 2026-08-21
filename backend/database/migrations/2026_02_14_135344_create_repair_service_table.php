<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('repair_service', function (Blueprint $table) {
            $table->id();
            
            // Foreign Keys
            $table->foreignId('repair_id')->constrained('repairs')->onDelete('cascade');
            $table->foreignId('service_id')->constrained('services')->onDelete('cascade');
            
            // Store price at booking time
            $table->decimal('price_at_booking', 10, 2)->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repair_service');
    }
};