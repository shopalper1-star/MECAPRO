<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$request = Illuminate\Http\Request::create('/api/receptionist/appointments', 'GET');
$user = App\Models\User::where('role', 'receptionist')->first();
$app->make(\Illuminate\Contracts\Auth\Factory::class)->guard()->setUser($user);
$response = $app->handle($request);
echo $response->getContent();
