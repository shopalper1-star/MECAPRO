<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Repair;

class RepairCompleted extends Notification
{
    use Queueable;

    public $repair;

    /**
     * Create a new notification instance.
     */
    public function __construct(Repair $repair)
    {
        $this->repair = $repair;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return ['mail']; // We can add 'vonage' (SMS) here later
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        // 1. Generate the link to the invoice
        $url = url('/api/repairs/' . $this->repair->id);

        // 2. Return the custom view
        return (new MailMessage)
            ->subject('Your Vehicle is Ready! 🚗')
            ->view('emails.repair_completed', [
                'user' => $notifiable,
                'repair' => $this->repair,
                'url' => $url
            ]);
    }
}