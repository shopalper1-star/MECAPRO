<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;

class AiRequestJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    private string $method;
    private string $url;
    private array $payload;
    private int $timeout;

    public function __construct(string $method, string $url, array $payload = [], int $timeout = 10)
    {
        $this->method = strtolower($method);
        $this->url = $url;
        $this->payload = $payload;
        $this->timeout = $timeout;
    }

    public function handle(): array
    {
        try {
            if ($this->method === 'post') {
                $response = Http::timeout($this->timeout)->post($this->url, $this->payload);
            } else {
                $response = Http::timeout($this->timeout)->get($this->url, $this->payload);
            }

            if ($response->failed()) {
                return [
                    'ok' => false,
                    'status' => $response->status(),
                    'data' => null,
                ];
            }

            return [
                'ok' => true,
                'status' => $response->status(),
                'data' => $response->json(),
            ];
        } catch (\Exception $e) {
            return [
                'ok' => false,
                'status' => 0,
                'data' => null,
            ];
        }
    }
}
