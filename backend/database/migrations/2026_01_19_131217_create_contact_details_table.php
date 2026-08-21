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
        Schema::create('contact_details', function (Blueprint $table) {
        $table->id();
        $table->string('name');    // Full Name
        $table->string('email');   // Email Address
        $table->string('phone');   // Phone Number
        $table->text('message');   // The Message (use text for long strings)
        $table->timestamps();      // Created_at & Updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contact_details');
    }
};
