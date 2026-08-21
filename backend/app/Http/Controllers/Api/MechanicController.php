<?php

namespace App\Http\Controllers\Api;

use App\Notifications\RepairCompleted;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Repair;
use App\Models\Service;
use App\Models\Part;
use App\Models\PartRequest;
use App\Http\Resources\RepairResource;
use Illuminate\Support\Facades\DB;

class MechanicController extends Controller
{
    /**
     * Get all repairs assigned to the logged-in mechanic
     */
    public function getMyRepairs(Request $request)
    {
        $user = $request->user();

        $repairs = Repair::where('mechanic_id', $user->id)
                        ->with(['vehicle.client', 'services']) 
                        ->orderBy('created_at', 'desc')
                        ->get();

        return RepairResource::collection($repairs);
    }

    /**
     * Get details for a specific job
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();

        $repair = Repair::where('id', $id)
            ->where('mechanic_id', $user->id)
            ->with(['vehicle.client', 'services', 'parts'])
            ->firstOrFail();

        return new RepairResource($repair);
    }

    /**
     * Update status (Generic)
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate(['status' => 'required|string']);

        $repair = Repair::findOrFail($id);

        if ($repair->mechanic_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $repair->status = $request->input('status');
        $repair->save();

        return response()->json([
            'message' => 'Status updated successfully', 
            'status' => $repair->status
        ]);
    }

    /**
     * SUBMIT DIAGNOSTIC & ESTIMATE
     */
    public function submitEstimate(Request $request, $id)
    {
        $repair = Repair::findOrFail($id);

        if ($repair->mechanic_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'mechanic_notes' => ['required', 'string', 'min:25', 'regex:/^[a-zA-Z0-9.,\s\r\n]*[a-zA-Z][a-zA-Z0-9.,\s\r\n]*$/'],
            'service_ids'    => 'required|array',
            'service_ids.*'  => 'exists:services,id',
        ], [
            'mechanic_notes.regex' => 'Mechanic notes must contain letters, and only use letters, numbers, periods, and commas.',
        ]);

        try {
            DB::beginTransaction();

            $repair->mechanic_notes = $request->mechanic_notes;
            
            // Capture if it's already a diagnostic job
            $isDiagnosticJob = $repair->is_diagnostic;

            $repair->services()->detach(); 
            
            $totalCost = 0;
            $hasDiagnosticService = false;
            
            foreach ($request->service_ids as $serviceId) {
                $service = Service::find($serviceId);
                $repair->services()->attach($serviceId, ['price_at_booking' => $service->price]);
                $totalCost += $service->price;
                
                // Check if this is the diagnostic service
                if (stripos($service->name, 'General Diagnostic') !== false || $service->zone === 'diagnostic') {
                    $hasDiagnosticService = true;
                    $isDiagnosticJob = true; // Update flag if mechanic selected it
                }
            }

            // FORCE ADD General Diagnostic if it's a diagnostic job but missing
            if ($isDiagnosticJob && !$hasDiagnosticService) {
                $diagnosticService = Service::where('name', 'like', '%General Diagnostic%')->first();
                if ($diagnosticService) {
                    $repair->services()->attach($diagnosticService->id, ['price_at_booking' => 50]); // Ensure 50 MAD
                    $totalCost += 50;
                    $hasDiagnosticService = true;
                }
            }

            $repair->cost = $totalCost;
            $repair->original_cost = $totalCost;
            $repair->is_diagnostic = $isDiagnosticJob; // Persist flag
            $repair->status = 'Estimate Sent';
            $repair->save();

            DB::commit();

            return response()->json([
                'message' => 'Estimate sent successfully',
                'repair' => new RepairResource($repair)
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed', 'details' => $e->getMessage()], 500);
        }
    }

    // --- PHASE 3: NEW METHODS ---

    /**
     * Get available parts inventory
     */
    public function getParts()
    {
        return Part::all();
    }

    /**
     * Request a Part for a Job (creates a PartRequest — awaits Parts Manager approval)
     */
    public function addParts(Request $request, $id)
    {
        $request->validate([
            'part_id'  => 'required|exists:parts,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $repair = Repair::findOrFail($id);

        if ($repair->mechanic_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Create a PartRequest (Parts Manager must approve)
        $partRequest = PartRequest::create([
            'repair_id'   => $repair->id,
            'mechanic_id' => $request->user()->id,
            'part_id'     => $request->part_id,
            'quantity'    => $request->quantity,
            'status'      => 'Pending',
        ]);

        return response()->json([
            'message'      => 'Part request submitted! Awaiting Parts Manager approval.',
            'part_request' => $partRequest->load('part'),
        ], 201);
    }

    /**
     * Get all part requests submitted by this mechanic
     */
    public function getPartRequests(Request $request)
    {
        $requests = PartRequest::where('mechanic_id', $request->user()->id)
            ->with(['part', 'repair.vehicle'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($requests);
    }

    /**
     * Mark Job as Completed
     */
    public function completeJob(Request $request, $id) 
    {
        // findOrFail returns a SINGLE model. 
        // If you use where(...)->get(), you get a Collection, causing your error.
        $repair = Repair::findOrFail($id); 

        if ($repair->mechanic_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($repair->status !== 'In Progress') {
             // Optional: Allow completing if it's 'Estimate Sent' just for testing, 
             // but realistically it should be 'In Progress'.
             // For now, let's strictly require 'In Progress' or 'Estimate Sent' to be safe.
             if ($repair->status !== 'Estimate Sent' && $repair->status !== 'In Progress') {
                 return response()->json(['message' => 'Job must be In Progress to complete.'], 400);
             }
        }

        $repair->status = 'Completed';
        $repair->save();

        
        $client = $repair->vehicle->client;
        if ($client) {
            $client->notify(new RepairCompleted($repair));
        }

        return response()->json([
            'message' => 'Great job! Repair marked as completed. Client notified.',
            'status' => 'Completed'
        ]);


        return response()->json([
            'message' => 'Great job! Repair marked as completed.',
            'status' => 'Completed'
        ]);
    }
}