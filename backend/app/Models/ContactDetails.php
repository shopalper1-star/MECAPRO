<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContactDetails extends Model
{
    use HasFactory;

    // This allows mass-assignment for these fields
    protected $fillable = [
        'name',
        'email',
        'phone',
        'message'
    ];
}