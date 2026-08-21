<?php

namespace App\Jobs;

use App\Mail\OtpMail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendOtpEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    private string $email;
    private string $name;
    private string $otp;

    public function __construct(string $email, string $name, string $otp)
    {
        $this->email = $email;
        $this->name = $name;
        $this->otp = $otp;
    }

    public function handle(): void
    {
        Mail::to($this->email)->send(new OtpMail($this->name, $this->otp));
    }
}
