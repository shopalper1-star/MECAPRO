<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'license_plate', // or 'plate' or 'plate_number' - make sure this matches your DB
        'make',
        'model',
        'year',
        'type',
    ];

    // --- CRITICAL FIX START ---
    public function client()
    {
        // This allows $vehicle->client to work
        return $this->belongsTo(User::class, 'user_id');
    }
    // --- CRITICAL FIX END ---

    public function repairs()
    {
        return $this->hasMany(Repair::class);
    }
}