<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PartRequest extends Model
{
    protected $fillable = [
        'repair_id', 'mechanic_id', 'part_id', 'quantity', 'status', 'notes'
    ];

    public function repair()
    {
        return $this->belongsTo(Repair::class);
    }

    public function mechanic()
    {
        return $this->belongsTo(User::class, 'mechanic_id');
    }

    public function part()
    {
        return $this->belongsTo(Part::class);
    }
}
