<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    use HasFactory;
    
    protected $fillable = ['name', 'zone', 'price'];

    // --- UPDATED: Belongs To Many Repairs ---
    public function repairs() {
        return $this->belongsToMany(Repair::class, 'repair_service');
    }
}