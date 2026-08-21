<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('vehicle_id')->nullable()->constrained('vehicles')->onDelete('set null');
            $table->date('preferred_date');
            $table->string('appointment_time')->nullable(); // Valid values: '08:00', '10:00', '14:00', '16:00'
            $table->string('description')->nullable();
            $table->enum('status', ['Pending', 'Approved', 'Declined'])->default('Pending');
            $table->text('receptionist_notes')->nullable();
            $table->foreignId('repair_id')->nullable()->constrained('repairs')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};