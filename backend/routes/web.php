<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()]);
});

Route::get('/test', function () {
    return 'Laravel is working! DB: ' . (app()->has('db') ? 'Connected' : 'Not connected');
});

Route::fallback(function () {
    return response()->json([
        'error' => 'Route not found',
        'message' => 'The requested route does not exist',
        'url' => request()->url()
    ], 404);
});