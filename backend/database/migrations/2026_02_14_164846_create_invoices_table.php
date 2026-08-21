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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('repair_id')->constrained()->onDelete('cascade');
            $table->string('invoice_number')->unique(); // e.g., INV-2026-001
            
            // Financials
            $table->decimal('total_amount', 10, 2); // Final sum to pay
            $table->decimal('paid_amount', 10, 2)->default(0.00);
            
            // Status
            $table->enum('status', ['Unpaid', 'Partially Paid', 'Paid'])->default('Unpaid');
            
            $table->date('due_date')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }
};
