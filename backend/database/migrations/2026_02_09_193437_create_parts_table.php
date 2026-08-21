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
        Schema::create('parts', function (Blueprint $table) {
            $table->id(); // This handles the integer ID
            $table->string('name');
            $table->string('zone'); // e.g., 'engine', 'wheels'
            $table->string('category'); // e.g., 'Pièces principales'
            $table->decimal('cost', 10, 2)->default(0.00);
            $table->decimal('price', 10, 2)->default(0.00); // Important for your Invoice
            $table->integer('stock_quantity')->default(10); // Default stock
            $table->string('reference_number')->nullable(); // For SKU/Barcodes
            $table->timestamps();
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('parts');
    }
};
