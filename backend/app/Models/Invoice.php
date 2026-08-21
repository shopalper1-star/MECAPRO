<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'repair_id',
        'invoice_number',
        'total_amount',
        'paid_amount',
        'status',
        'paid_at'
    ];

    public function repair()
    {
        return $this->belongsTo(Repair::class);
    }
}