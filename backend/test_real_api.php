<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Http\Request;
use App\Http\Controllers\Api\AppointmentController;
use App\Models\User;

// Simulate authenticated request for client (user 16)
$client = User::find(16);
$request = new Request();
$request->setUserResolver(function () use ($client) {
    return $client;
});

$controller = new AppointmentController();
$response = $controller->clientIndex($request);

echo "=== CLIENT API RESPONSE ===\n";
echo $response->getContent();
echo "\n\n";

// Test receptionist endpoint
$receptionist = User::where('role', 'receptionist')->first();
$request2 = new Request();
$request2->setUserResolver(function () use ($receptionist) {
    return $receptionist;
});

$response2 = $controller->receptionistIndex($request2);
echo "=== RECEPTIONIST API RESPONSE ===\n";
echo $response2->getContent();
