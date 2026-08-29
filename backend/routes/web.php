<?php

use Illuminate\Support\Facades\Route;

// Health check (without /api prefix - accessible directly)
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()]);
});

// Test DB connection
Route::get('/test', function () {
    return 'Laravel is working! DB: ' . (app()->has('db') ? 'Connected' : 'Not connected');
});

// Serve React app - MUST BE LAST ROUTE
// IMPORTANT: This excludes /api/* routes so they go to api.php
Route::get('/{any}', function () {
    $indexPath = public_path('index.html');

    if (file_exists($indexPath)) {
        return response()->file($indexPath);
    }

    return response()->json([
        'error' => 'Frontend not built',
        'message' => 'index.html not found in public directory.',
        'public_path' => public_path()
    ], 500);
})->where('any', '^(?!api).*$');