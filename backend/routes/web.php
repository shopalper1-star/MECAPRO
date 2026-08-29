<?php

use Illuminate\Support\Facades\Route;

// Health check
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()]);
});

// Test DB connection
Route::get('/test', function () {
    return 'Laravel is working! DB: ' . (app()->has('db') ? 'Connected' : 'Not connected');
});

// API routes
Route::prefix('api')->group(function () {
    Route::get('/health', function () {
        return response()->json(['status' => 'ok', 'timestamp' => now()]);
    });
});

// Serve React app - MUST BE LAST ROUTE
Route::get('/{any}', function () {
    $indexPath = public_path('index.html');

    if (file_exists($indexPath)) {
        return response()->file($indexPath);
    }

    return response()->json([
        'error' => 'Frontend not built',
        'message' => 'index.html not found in public directory. Check that the frontend was built correctly.',
        'public_path' => public_path()
    ], 500);
})->where('any', '.*');