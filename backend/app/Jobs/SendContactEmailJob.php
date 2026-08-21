<?php

namespace App\Jobs;

use App\Mail\ContactMail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendContactEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    private string $to;
    private array $data;

    public function __construct(string $to, array $data)
    {
        $this->to = $to;
        $this->data = $data;
    }

    public function handle(): void
    {
        Mail::to($this->to)->send(new ContactMail($this->data));
    }
}
