<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    protected $fillable = [
        'user_id', 'vehicle_id', 'preferred_date', 'appointment_time',
        'description', 'status', 'receptionist_notes', 'repair_id'
    ];

    public function client()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function repair()
    {
        return $this->belongsTo(Repair::class);
    }
}
