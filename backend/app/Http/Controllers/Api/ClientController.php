<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Vehicle;
use App\Models\Repair; // Don't forget this import!
use App\Http\Resources\RepairResource;

class ClientController extends Controller
{
    /**
     * Get Client's Vehicles and Repair History
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $vehicles = Vehicle::where('user_id', $user->id)
                        ->with(['repairs' => function($query) {
                            $query->orderBy('created_at', 'desc');
                        }])
                        ->get();

        return response()->json($vehicles);
    }

    /**
     * Approve the Estimate (Start the Job)
     */
    public function approveJob(Request $request, $id)
    {
        $repair = Repair::findOrFail($id);

        // Security Check: Does the client own this vehicle?
        if ($repair->vehicle->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized access to this job.'], 403);
        }

        // Status Check
        if ($repair->status !== 'Estimate Sent') { 
             return response()->json(['message' => 'Cannot approve this job right now.'], 400);
        }

        // Action: Update Status
        $repair->status = 'In Progress'; 
        $repair->save();

        return response()->json([
            'message' => 'Job approved! The mechanic will start working soon.',
            'status' => $repair->status
        ]);
    }

    /**
     * Decline the Estimate (Cancel the Job)
     */
    public function declineJob(Request $request, $id)
    {
        $repair = Repair::findOrFail($id);

        // Security Check: Does the client own this vehicle?
        if ($repair->vehicle->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized access to this job.'], 403);
        }

        // Status Check
        if ($repair->status !== 'Estimate Sent') { 
             return response()->json(['message' => 'Cannot decline this job right now.'], 400);
        }

        // Action: Update Status
        $repair->status = 'Cancelled'; 
        $repair->save();

        return response()->json([
            'message' => 'Estimate declined. Job has been cancelled.',
            'status' => $repair->status
        ]);
    }

    /**
     * Negotiate the Price (Request Discount)
     */
    public function negotiateJob(Request $request, $id)
    {
        $repair = Repair::findOrFail($id);

        // Security Check
        if ($repair->vehicle->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized access to this job.'], 403);
        }

        // Validation Rules:
        // 1. Must be in 'Estimate Sent' status.
        // 2. Must not have already negotiated.
        if ($repair->status !== 'Estimate Sent') {
            return response()->json(['message' => 'Negotiation is not available for this job status.'], 400);
        }
        
        if ($repair->negotiation_count > 0) {
            return response()->json(['message' => 'You have already used your negotiation request.'], 400);
        }

        // Action: Update Status & Flag
        $repair->status = 'Negotiation Requested'; // Notify Receptionist
        $repair->negotiation_status = 'Requested';
        $repair->negotiation_count = 1; // Mark as used
        $repair->save();

        return response()->json([
            'message' => 'Negotiation request sent to the receptionist.',
            'status' => $repair->status,
            'negotiation_status' => $repair->negotiation_status
        ]);
    }

    public function repairs(Request $request)
    {
        $perPage = (int) $request->query('per_page', 15);
        if ($perPage < 1) {
            $perPage = 15;
        }
        if ($perPage > 100) {
            $perPage = 100;
        }

        $repairs = Repair::whereHas('vehicle', function ($query) use ($request) {
            $query->where('user_id', $request->user()->id);
        })
            ->with(['vehicle', 'services', 'parts'])
            ->paginate($perPage);

        return RepairResource::collection($repairs);
    }
}
