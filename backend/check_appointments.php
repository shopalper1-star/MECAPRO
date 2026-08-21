<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$clients = \App\Models\User::where('role', 'client')->limit(5)->get(['id', 'name']);
foreach($clients as $c) {
    $count = \App\Models\Appointment::where('user_id', $c->id)->count();
    echo "User {$c->id} ({$c->name}): {$count} appointments\n";
}
