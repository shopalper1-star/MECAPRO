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
    Schema::create('part_repair', function (Blueprint $table) {
        $table->id();

        // The two foreign keys
        $table->foreignId('repair_id')->constrained()->onDelete('cascade');
        $table->foreignId('part_id')->constrained()->onDelete('cascade');

        // The extra fields for the invoice
        $table->integer('quantity')->default(1);
        $table->decimal('price', 10, 2)->default(0);

        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('repair_part');
    }
};
