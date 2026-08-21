<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmailVerification extends Model
{
    use HasFactory;

    protected $fillable = [
        'email',
        'otp',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    /**
     * Check if OTP is valid (matches and not expired)
     */
    public function isValid($otp)
    {
        return $this->otp === $otp && now()->lessThan($this->expires_at);
    }

    /**
     * Check if OTP is expired
     */
    public function isExpired()
    {
        return now()->greaterThan($this->expires_at);
    }

    /**
     * Cleanup expired OTPs (can be run via scheduler)
     */
    public static function cleanupExpired()
    {
        return self::where('expires_at', '<', now())->delete();
    }
}