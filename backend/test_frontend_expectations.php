<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

// Test 1: Check client appointments endpoint format
echo "=== USER 16 APPOINTMENTS ===\n";
$user16 = User::find(16);
$apptRes = [
    'data' => \App\Models\Appointment::where('user_id', 16)
        ->with(['vehicle', 'repair'])
        ->orderBy('preferred_date', 'asc')
        ->orderBy('appointment_time', 'asc')
        ->get(),
    'message' => 'Appointments retrieved successfully'
];

// Test what the frontend expects
echo "apptRes.data.data would be: " . gettype($apptRes['data']) . " with " . count($apptRes['data']) . " items\n";
echo "apptRes.data.data[0] would be: " . ($apptRes['data'][0] ? "✓ Found appointment" : "✗ No appointment") . "\n";

// Test  stat calculations
$appointmentCount = count($apptRes['data'] ?? []);
$pendingCount = collect($apptRes['data'])->filter(fn($a) => $a->status === 'Pending')->count();

echo "\nStats would be:\n";
echo "- Total appointments: " . $appointmentCount . "\n";
echo "- Pending appointments: " . $pendingCount . "\n";

// Test receptionist endpoint  
echo "\n=== RECEPTIONIST APPOINTMENTS ===\n";
$allAppts = \App\Models\Appointment::with(['client', 'vehicle', 'repair'])
    ->orderBy('preferred_date', 'asc')
    ->orderBy('appointment_time', 'asc')
    ->get();

$receptionistRes = [
    'data' => $allAppts,
    'message' => 'Appointments retrieved successfully'
];

echo "Total appointments in system: " . count($receptionistRes['data']) . "\n";
$pendingInSystem = collect($receptionistRes['data'])->filter(fn($a) => $a->status === 'Pending')->count();
$approvedInSystem = collect($receptionistRes['data'])->filter(fn($a) => $a->status === 'Approved')->count();

echo "Pending: $pendingInSystem, Approved: $approvedInSystem\n";
