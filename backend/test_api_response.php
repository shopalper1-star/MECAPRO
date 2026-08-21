<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Appointment;

// Test with user 16 who has appointments
$user = User::find(16);

if ($user) {
    echo "Testing Client API Response for User: {$user->name} (ID: {$user->id})\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Simulate what the API controller does
    $appointments = Appointment::where('user_id', $user->id)
        ->with(['vehicle', 'repair'])
        ->orderBy('preferred_date', 'asc')
        ->orderBy('appointment_time', 'asc')
        ->get();
    
    // This is what the API returns
    $response = [
        'data' => $appointments,
        'message' => 'Appointments retrieved successfully'
    ];
    
    echo "API Response Status: 200\n";
    echo "Response Format:\n";
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
