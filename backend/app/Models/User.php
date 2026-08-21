<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone', // Added: Useful for the dashboard contact inf
        'is_verified',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_verified' => 'boolean',
        ];
    }

    // A Client has many vehicles
    // Note: Since the foreign key in vehicles table is 'user_id', we specify it here
    public function vehicles()
    {
        return $this->hasMany(Vehicle::class, 'user_id');
    }

    // A Mechanic has many repairs assigned to them
    public function repairs()
    {
        return $this->hasMany(Repair::class, 'mechanic_id');
    }
}