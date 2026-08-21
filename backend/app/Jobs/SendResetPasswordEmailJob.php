<?php

namespace App\Jobs;

use App\Mail\ResetPasswordMail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendResetPasswordEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    private string $email;
    private string $resetUrl;

    public function __construct(string $email, string $resetUrl)
    {
        $this->email = $email;
        $this->resetUrl = $resetUrl;
    }

    public function handle(): void
    {
        Mail::to($this->email)->send(new ResetPasswordMail($this->resetUrl));
    }
}
