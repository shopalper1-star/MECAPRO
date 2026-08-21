<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$appointments = App\Models\Appointment::with(['client', 'vehicle', 'repair'])->orderBy('created_at', 'desc')->take(1)->get();
echo json_encode($appointments);
