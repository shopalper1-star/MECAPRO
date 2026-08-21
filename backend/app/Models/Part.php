<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Part extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'zone',
        'category',
        'price',
        'cost',
        'stock_quantity', // Matches your migration
        'reference_number' // Matches your migration
    ];

    /**
     * The repairs that use this part.
     */
    public function repairs()
    {
        return $this->belongsToMany(Repair::class, 'repair_part')
                    ->withPivot('quantity', 'price') 
                    ->withTimestamps();
    }
}