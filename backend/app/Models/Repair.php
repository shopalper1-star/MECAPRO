<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Part;

class Repair extends Model
{
    use HasFactory;
    
    protected $guarded = []; // Allows all fields to be filled (easier for development)

    protected $fillable = [
        'vehicle_id',
        'mechanic_id',
        'description',       // Receptionist's initial notes
        'mechanic_notes',    // New: Mechanic's findings
        'status',
        'is_diagnostic',     // New: Boolean flag
        'date_entry',
        'date_end',
        'cost',              // Current Total
        'original_cost',     // New: Price before negotiation
        'discount_amount',   // New
        'negotiation_status',// New
        'negotiation_count', // New
        'invoice_number'
    ];

    // --- RELATIONSHIPS ---

    public function vehicle() {
        return $this->belongsTo(Vehicle::class);
    }

    public function mechanic() {
        return $this->belongsTo(User::class, 'mechanic_id');
    }

    public function services() {
        return $this->belongsToMany(Service::class, 'repair_service')
                    ->withPivot('price_at_booking')
                    ->withTimestamps();
    }

    public function parts()
    {
        return $this->belongsToMany(Part::class, 'part_repair', 'repair_id', 'part_id')
                    ->withPivot('quantity', 'price')
                    ->withTimestamps();
    }
}