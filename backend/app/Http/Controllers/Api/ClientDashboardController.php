<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Vehicle;
use App\Models\Repair;

class ClientDashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // 1. KPI: Total Vehicles Owned
        $vehiclesCount = Vehicle::where('user_id', $user->id)->count();

        // 2. KPI: Active Repairs (Pending, In Progress, Confirmed)
        // We look for repairs belonging to this user's vehicles
        $activeRepairsCount = Repair::whereHas('vehicle', function($q) use ($user) {
            $q->where('user_id', $user->id);
        })->whereIn('status', ['Pending', 'In Progress', 'Confirmed'])->count();

        // 3. KPI: Invoices (Completed repairs representing 'Ready to Pay')
        $invoicesCount = Repair::whereHas('vehicle', function($q) use ($user) {
            $q->where('user_id', $user->id);
        })->where('status', 'Completed')->count();

        // 4. MIDDLE SECTION: The actual Active Repair Data
        // We get the full object (Vehicle + Mechanic) for repairs currently happening
        $currentRepairs = Repair::with(['vehicle', 'mechanic', 'service'])
            ->whereHas('vehicle', function($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        // 5. BOTTOM SECTION: History (Oldest first or strictly completed/cancelled)
        // Actually, your design shows "Engine Diagnostics" at bottom. 
        // Let's make this the "Repair History" list (excluding the one currently active if you want, or just all latest).
        $latestHistory = Repair::with(['vehicle'])
            ->whereHas('vehicle', function($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        return response()->json([
            'kpi' => [
                'vehicles_count' => $vehiclesCount,
                'active_repairs' => $activeRepairsCount,
                'invoices_due'   => $invoicesCount
            ],
            'current_jobs' => $currentRepairs, // For the middle cards
            'history' => $latestHistory       // For the bottom list
        ]);
    }
}