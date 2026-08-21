<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Simulate a logged-in user (ID 72)
$user = App\Models\User::find(72);

if ($user) {
    echo "Testing for User ID: {$user->id} ({$user->name}) - Role: {$user->role}\n\n";
    
    // Query like the API does
    $appointments = App\Models\Appointment::where('user_id', $user->id)
        ->with(['vehicle', 'repair'])
        ->orderBy('created_at', 'desc')
        ->get();
    
    echo "Appointments count: " . count($appointments) . "\n";
    echo json_encode($appointments, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} else {
    echo "User not found";
}
