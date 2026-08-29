<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ContactDetailsController;
use App\Http\Controllers\Api\ForgotPasswordController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\MechanicController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\ReceptionistController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\PartsManagerController;
use App\Http\Controllers\Api\SupervisorController;
use App\Http\Controllers\Api\AiController;
use GuzzleHttp\Client;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::get('/health', [App\Http\Controllers\HealthController::class, 'check']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/verifyemail', [AuthController::class, 'verifyemail']);
Route::post('/resend-otp', [AuthController::class, 'resendOtp']);
Route::post('/contact', [ContactDetailsController::class, 'store']);
Route::post('/forgot-password', [ForgotPasswordController::class, 'sendResetLink']);
Route::post('/reset-password', [ForgotPasswordController::class, 'reset']);
Route::get('/services', [ServiceController::class, 'index']);

// AI Routes — PUBLIC (used on homepage without login + by logged-in clients)
Route::prefix('ai')->group(function () {
    Route::get('/health', [AiController::class, 'health']);
    Route::get('/options', [AiController::class, 'options']);
    Route::post('/predict', [AiController::class, 'predict']);
});

// Proxy to Flask (if AiController is not working, this will call Flask directly)
Route::post('/ai-proxy', function (Request $request) {
    try {
        $client = new Client(['timeout' => 30]);
        $response = $client->post('http://127.0.0.1:5000/predict', [
            'json' => $request->all()
        ]);
        return response()->json(json_decode($response->getBody(), true), $response->getStatusCode());
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'AI service unavailable',
            'message' => $e->getMessage()
        ], 500);
    }
});


Route::get('/test-flask', function () {
    try {
        $client = new \GuzzleHttp\Client(['timeout' => 5]);
        $response = $client->get('http://127.0.0.1:5000/health');
        return response()->json([
            'flask_status' => 'reachable',
            'response' => json_decode($response->getBody(), true)
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'flask_status' => 'unreachable',
            'error' => $e->getMessage()
        ], 500);
    }
});


// Appointment Availability — PUBLIC (no auth, used by clients before login)
Route::get('/appointments/available-slots', [AppointmentController::class, 'availableSlots']);
Route::get('/appointments/available-days', [AppointmentController::class, 'availableDays']);

/*
|--------------------------------------------------------------------------
| Protected Routes (Requires Login)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // --- User & Auth ---
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/repairs/{id}/invoice', [InvoiceController::class, 'generate']);
    Route::post('/invoices/{id}/pay', [InvoiceController::class, 'pay']);

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::post('/staff', [AuthController::class, 'createStaff']);

    // --- General Data ---
    Route::get('/vehicles', [VehicleController::class, 'index']);
    Route::post('/vehicles', [VehicleController::class, 'store']);
    Route::get('/client/vehicles', [ClientController::class, 'index']);
    Route::post('/jobs/{id}/approve', [ClientController::class, 'approveJob']);
    Route::post('/jobs/{id}/decline', [ClientController::class, 'declineJob']);
    Route::post('/jobs/{id}/negotiate', [ClientController::class, 'negotiateJob']);

    // --- MECHANIC ROUTES ---
    Route::prefix('mechanic')->group(function () {
        Route::get('/jobs', [MechanicController::class, 'getMyRepairs']);
        Route::get('/jobs/{id}', [MechanicController::class, 'show']);
        Route::patch('/jobs/{id}', [MechanicController::class, 'updateStatus']);
        Route::post('/jobs/{id}/estimate', [MechanicController::class, 'submitEstimate']);
        Route::get('/parts', [MechanicController::class, 'getParts']);
        Route::post('/jobs/{id}/parts', [MechanicController::class, 'addParts']);
        Route::get('/part-requests', [MechanicController::class, 'getPartRequests']);
        Route::post('/jobs/{id}/complete', [MechanicController::class, 'completeJob']);
    });

    // --- RECEPTIONIST ROUTES ---
    Route::prefix('receptionist')->group(function () {
        Route::get('/dashboard', [ReceptionistController::class, 'dashboard']);
        Route::get('/mechanics-load', [ReceptionistController::class, 'mechanicsLoad']);
        Route::get('/clients/search', [ReceptionistController::class, 'searchClients']);
        Route::get('/clients/{id}/vehicles', [ReceptionistController::class, 'getClientVehicles']);
        Route::get('/clients-summary', [ReceptionistController::class, 'getClientsWithRepairs']);
        Route::get('/client/{id}/repairs', [ReceptionistController::class, 'getClientRepairs']);
        Route::post('/jobs', [ReceptionistController::class, 'storeJob']);
        Route::delete('/jobs/{id}', [ReceptionistController::class, 'deleteJob']);
        Route::get('/repair/{id}', [ReceptionistController::class, 'show']);
        Route::put('/repairs/{id}/status', [ReceptionistController::class, 'updateStatus']);
        Route::get('/repairs/{id}/invoice', [ReceptionistController::class, 'invoice']);
        Route::post('/jobs/{id}/negotiate', [ReceptionistController::class, 'handleNegotiation']);
        Route::get('/appointments', [AppointmentController::class, 'receptionistIndex']);
        Route::post('/appointments/{id}/approve', [AppointmentController::class, 'approve']);
        Route::post('/appointments/{id}/decline', [AppointmentController::class, 'decline']);
    });

    // --- CLIENT ROUTES ---
    Route::prefix('client')->group(function () {
        Route::get('/repairs', function (Request $request) {
            $repairs = \App\Models\Repair::whereHas('vehicle', function ($query) use ($request) {
                $query->where('user_id', $request->user()->id);
            })->with(['vehicle', 'services', 'parts'])->get();
            return \App\Http\Resources\RepairResource::collection($repairs);
        });
        Route::post('/appointments', [AppointmentController::class, 'store']);
        Route::get('/appointments', [AppointmentController::class, 'clientIndex']);
    });

    // --- PARTS MANAGER ROUTES ---
    Route::prefix('parts-manager')->group(function () {
        Route::get('/dashboard', [PartsManagerController::class, 'dashboard']);
        Route::get('/requests', [PartsManagerController::class, 'requests']);
        Route::post('/requests/{id}/approve', [PartsManagerController::class, 'approve']);
        Route::post('/requests/{id}/decline', [PartsManagerController::class, 'decline']);
        Route::post('/parts', [PartsManagerController::class, 'storePart']);
        Route::post('/services', [PartsManagerController::class, 'storeService']);
    });

    // --- SUPERVISOR ROUTES ---
    Route::prefix('supervisor')->group(function () {
        Route::get('/staff', [SupervisorController::class, 'index']);
        Route::post('/staff', [SupervisorController::class, 'store']);
        Route::put('/staff/{id}', [SupervisorController::class, 'update']);
        Route::patch('/staff/{id}/toggle-status', [SupervisorController::class, 'toggleStatus']);
    });
});