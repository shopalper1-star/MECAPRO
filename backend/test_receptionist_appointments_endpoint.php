<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Http\Request;
use App\Http\Controllers\Api\AppointmentController;
use App\Models\User;

// Simulate authenticated request for receptionist
$receptionist = User::where('role', 'receptionist')->first();
if (!$receptionist) {
    echo "No receptionist found in database\n";
    exit(1);
}

$request = new Request();
$request->setUserResolver(function () use ($receptionist) {
    return $receptionist;
});

try {
    $controller = new AppointmentController();
    $response = $controller->receptionistIndex($request);
    
    echo "✓ API ENDPOINT WORKS\n";
    echo "Response Status: 200\n";
    $data = json_decode($response->getContent(), true);
    echo "Total appointments returned: " . count($data['data'] ?? []) . "\n";
    echo "Pending: " . count(array_filter($data['data'] ?? [], fn($a) => $a['status'] === 'Pending')) . "\n";
} catch (\Exception $e) {
    echo "✗ ERROR: " . $e->getMessage() . "\n";
}
