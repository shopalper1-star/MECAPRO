<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Appointment;
use App\Models\User;
use App\Models\Vehicle;
use Carbon\Carbon;

// Get the first few clients
$clients = User::where('role', 'client')->limit(3)->get();

foreach ($clients as $client) {
    // Get one of their vehicles if they have any
    $vehicle = Vehicle::where('user_id', $client->id)->first();
    
    if (!$vehicle) {
        // Create a test vehicle
        $vehicle = Vehicle::create([
            'user_id' => $client->id,
            'make' => 'Toyota',
            'model' => 'Camry',
            'year' => 2024,
            'license_plate' => 'TEST-' . $client->id,
            'type' => 'car'
        ]);
    }
    
    // Create 2-3 test appointments for each client
    $statuses = ['Pending', 'Approved', 'Declined'];
    
    for ($i = 0; $i < 3; $i++) {
        $dateOffset = $i + 1;
        $timeSlots = ['08:00', '10:00', '14:00', '16:00'];
        
        Appointment::create([
            'user_id' => $client->id,
            'vehicle_id' => $vehicle->id,
            'preferred_date' => Carbon::now()->addDays($dateOffset)->toDateString(),
            'appointment_time' => $timeSlots[$i] ?? '10:00',
            'description' => 'Test appointment ' . ($i + 1),
            'status' => $statuses[$i % 3],
            'receptionist_notes' => $i > 0 ? 'Test notes' : null
        ]);
    }
}

echo "✓ Test appointments created for " . count($clients) . " clients\n";
