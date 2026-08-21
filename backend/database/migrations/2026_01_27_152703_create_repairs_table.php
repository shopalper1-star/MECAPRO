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
        // 1. Create the main repairs table
        Schema::create('repairs', function (Blueprint $table) {
            $table->id();
            
            // --- Foreign Keys ---
            $table->foreignId('vehicle_id')->constrained()->onDelete('cascade');
            $table->foreignId('mechanic_id')->constrained('users')->onDelete('cascade');
            
            // --- Basic Info ---
            $table->text('description')->nullable(); // Receptionist notes (e.g., "Customer hears noise")
            $table->text('mechanic_notes')->nullable(); // New: Technical findings from diagnosis
            
            // --- Status & Workflow ---
            $table->string('status')->default('Pending'); 
            // Expected values: 'Pending', 'Diagnosing', 'Estimate Sent', 'Negotiating', 'Approved', 'In Progress', 'Completed', 'Canceled'
            
            $table->boolean('is_diagnostic')->default(false); // New: Identifies if this started as a diagnostic request
            
            // --- Dates ---
            $table->dateTime('date_entry'); // When the car arrived
            $table->dateTime('date_end')->nullable(); // Estimated completion (nullable until approved)
            
            // --- Financials & Negotiation ---
            $table->decimal('cost', 10, 2)->default(0.00); // Current total price to pay
            
            $table->decimal('original_cost', 10, 2)->nullable(); // New: Price BEFORE discount
            $table->decimal('discount_amount', 10, 2)->default(0.00); // New: Value of discount given
            
            // Negotiation Tracking
            $table->enum('negotiation_status', ['None', 'Requested', 'Approved', 'Rejected'])->default('None');
            $table->integer('negotiation_count')->default(0); // New: Limit to 1 request
            
            $table->string('invoice_number')->unique()->nullable(); // Nullable until invoice is generated
            $table->timestamps();
        });

        // 2. Create the Pivot Table (Many-to-Many: Repairs <-> Services)
        // Schema::create('repair_service', function (Blueprint $table) {
        //     $table->id();
        //     $table->foreignId('repair_id')->constrained('repairs')->onDelete('cascade');
        //     $table->foreignId('service_id')->constrained('services')->onDelete('cascade');
            
        //     // Optional: Store price at time of booking in case service price changes later
        //     $table->decimal('price_at_booking', 10, 2)->nullable(); 
            
        //     $table->timestamps();
        // });
    }
    
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop in reverse order to avoid foreign key constraints
        Schema::dropIfExists('repair_service');
        Schema::dropIfExists('repairs');
    }
};