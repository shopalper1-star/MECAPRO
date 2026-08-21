<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public $userName;
    public $otp;

    public function __construct($userName, $otp)
    {
        $this->userName = $userName;
        $this->otp = $otp;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Email Verification - MecaPro',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.otp', // This will be our custom view
        );
    }

    public function attachments(): array
    {
        return [];
    }
}