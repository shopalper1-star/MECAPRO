<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ResetPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public $url;

    // 1. Accept the URL in the constructor
    public function __construct($url)
    {
        $this->url = $url;
    }

    public function build()
    {
        // 2. Build the email view
        return $this->subject('Reset Your Password - MecaPro')
                    ->view('emails.reset_password'); 
    }
}