<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\Repair;
use App\Models\Service;
use App\Http\Resources\RepairResource;
use Illuminate\Support\Facades\DB;

class ReceptionistController extends Controller
{
    /**
     * GET /receptionist/mechanics-load
     * Returns active mechanics sorted by today's repair count (least busy first)
     */
    public function mechanicsLoad()
    {
        $mechanics = User::where('role', 'mechanic')
            ->where('is_active', 1)
            ->withCount(['repairs as repairs_today' => function ($query) {
                $query->whereDate('date_entry', today())
                      ->where('status', '!=', 'Canceled');
            }])
            ->orderBy('repairs_today', 'asc')
            ->get();

        return response()->json($mechanics);
    }

    public function dashboard()
    {
        $mechanics = User::whereIn('role', ['Mechanic', 'mechanic', 'MECHANIC'])
                        ->get(['id', 'name']);

        // Keep dashboard payload intentionally lean for faster first paint.
        $repairs = Repair::select([
                'id',
                'vehicle_id',
                'mechanic_id',
                'description',
                'cost',
                'status',
                'date_end',
                'invoice_number',
                'created_at',
                'is_diagnostic',
                'negotiation_count',
                'original_cost',
            ])
            ->with([
                'vehicle:id,user_id,make,model,type,license_plate',
                'vehicle.client:id,name',
                'mechanic:id,name',
                'services:id,name,zone,price',
            ])
            ->orderBy('created_at', 'desc')
            ->limit(150)
            ->get();

        $today = now()->toDateString();
        $todaysAppointments = Repair::whereDate('date_end', $today)->count();
        $confirmedToday = Repair::whereDate('date_end', $today)->where('status', 'Completed')->count();

        $pendingNegotiationsByClient = Repair::join('vehicles', 'repairs.vehicle_id', '=', 'vehicles.id')
            ->whereRaw('LOWER(repairs.status) = ?', ['negotiation requested'])
            ->select('vehicles.user_id', DB::raw('COUNT(*) as total'))
            ->groupBy('vehicles.user_id')
            ->pluck('total', 'vehicles.user_id');

        return response()->json([
            'user' => [
                'name' => Auth::user()->name,
                'role' => Auth::user()->role
            ],
            'mechanics' => $mechanics,
            'stats' => [
                'todaysAppointments' => $todaysAppointments,
                'confirmedToday' => $confirmedToday,
            ],
            'pending_negotiations_by_client' => $pendingNegotiationsByClient,
            'repairs' => RepairResource::collection($repairs)
        ]);
    }

    public function searchClients(Request $request)
    {
        $query = $request->input('query');
        if (!$query) return response()->json([]);

        $clients = User::whereIn('role', ['Client', 'client', 'CUSTOMER', 'customer'])
            ->where('name', 'LIKE', "%{$query}%")
            ->limit(10)
            ->get(['id', 'name']);

        return response()->json($clients);
    }

    public function getClientVehicles($clientId)
    {
        $vehicles = Vehicle::where('user_id', $clientId)->get();
        return response()->json($vehicles);
    }

    public function storeJob(Request $request)
    {
        // 1. Validate
        $validated = $request->validate([
            'vehicle_id'    => 'required',
            'mechanic_id'   => 'required',
            'service_ids'   => 'required|array', 
            'service_ids.*' => 'exists:services,id',
            'description'   => ['nullable', 'string', 'min:25', 'regex:/^[a-zA-Z0-9.,\s\r\n]*[a-zA-Z][a-zA-Z0-9.,\s\r\n]*$/'], 
            'cost'          => 'required', 
            'date_end'      => 'required|date'
        ], [
            'description.regex' => 'Description must contain letters, and only use letters, numbers, periods, and commas.',
        ]);

        // 1b. Daily cap check — max 5 repairs per mechanic per day
        $repairsToday = Repair::where('mechanic_id', $request->mechanic_id)
                      ->whereDate('date_entry', today())
                      ->where('status', '!=', 'Canceled')
                      ->count();

        if ($repairsToday >= 5) {
            return response()->json([
                'message' => 'This mechanic already has 5 repairs today.'
            ], 422);
        }

        // Check if "General Diagnostic" is in the selected services
        $isDiagnostic = Service::whereIn('id', $validated['service_ids'])
            ->where(function($query) {
                $query->where('name', 'LIKE', '%General Diagnostic%')
                      ->orWhere('zone', 'diagnostic');
            })
            ->exists();

        // 2. Create Repair
        $repair = Repair::create([
            'vehicle_id'     => $validated['vehicle_id'],
            'mechanic_id'    => $validated['mechanic_id'],
            'description'    => $validated['description'] ?? 'Standard Service',
            'cost'           => $validated['cost'],
            'original_cost'  => $validated['cost'], // Save original cost
            'status'         => 'Pending',
            'is_diagnostic'  => $isDiagnostic, // Set diagnostic flag
            'date_entry'     => now(),
            'date_end'       => $validated['date_end'],
            // Invoice number is usually generated after job is done/approved, 
            // but if you generate it here, that's fine too.
            'invoice_number' => 'INV-' . strtoupper(uniqid()), 
        ]);
        
        // 3. Attach Services
        $repair->services()->attach($validated['service_ids']);

        // 4. Load Relationships
        $repair->load(['vehicle.client', 'mechanic', 'services']); 

        return response()->json([
            'message' => 'Created Successfully', 
            'repair'  => new RepairResource($repair) 
        ]);
    }

    

    public function updateStatus(Request $request, $id)
    {
        // UPDATED: Added new statuses to validation
        $request->validate([
            'status' => 'required|in:Pending,Diagnosing,Estimate Sent,Estimate Accepted,Negotiation Requested,In Progress,Completed,Canceled,Delivered,Waiting for Parts'
        ]);

        $repair = Repair::findOrFail($id);
        
        if ($request->status === 'Delivered' && strtolower($repair->status) !== 'completed') {
            return response()->json([
                'message' => 'Only completed repairs can be marked as delivered.'
            ], 422);
        }

        $repair->status = $request->status;
        $repair->save();

        return response()->json([
            'message' => 'Status Updated',
            'repair' => new RepairResource($repair)
        ]);
    }

    /**
     * NEW: Handle Negotiation & Generate Invoice
     */
    public function handleNegotiation(Request $request, $id)
    {
        $repair = Repair::with(['services', 'parts'])->findOrFail($id);

        $request->validate([
            'decision' => 'required|in:approve,reject',
            'custom_prices' => 'nullable|array'
        ]);

        if ($repair->status !== 'Negotiation Requested') {
            return response()->json(['message' => 'No active negotiation for this job.'], 400);
        }

        if ($request->decision === 'approve') {
            $customPrices = $request->input('custom_prices', []);
            $newTotalCost = 0;

            // Update Services Pivots
            if (isset($customPrices['services']) && is_array($customPrices['services'])) {
                foreach ($repair->services as $service) {
                    $newPrice = isset($customPrices['services'][$service->id]) ? $customPrices['services'][$service->id] : $service->price;
                    $repair->services()->updateExistingPivot($service->id, ['price_at_booking' => $newPrice]);
                    $newTotalCost += $newPrice;
                }
            } else {
                foreach ($repair->services as $service) {
                    $newTotalCost += $service->price;
                }
            }

            // Update Parts Pivots
            if (isset($customPrices['parts']) && is_array($customPrices['parts'])) {
                foreach ($repair->parts as $part) {
                    $newPrice = isset($customPrices['parts'][$part->id]) ? $customPrices['parts'][$part->id] : ($part->pivot->price ?? $part->price);
                    $qty = $part->pivot->quantity ?? 1;
                    $repair->parts()->updateExistingPivot($part->id, ['price' => $newPrice]);
                    $newTotalCost += ($newPrice * $qty);
                }
            } else {
                 foreach ($repair->parts as $part) {
                     $price = $part->pivot->price ?? $part->price;
                     $qty = $part->pivot->quantity ?? 1;
                     $newTotalCost += ($price * $qty);
                 }
            }

            // Calculate overall discount
            $discount = max(0, $repair->original_cost - $newTotalCost);
            $repair->cost = $newTotalCost;
            $repair->discount_amount = $discount;
            $repair->negotiation_status = 'Approved';
            $message = "Discount approved! New price: " . $repair->cost . " MAD";
        } else {
            // Reject: Revert to original price
            $repair->cost = $repair->original_cost;
            $repair->discount_amount = 0;
            $repair->negotiation_status = 'Rejected';
            $message = "Discount rejected. Price remains: " . $repair->cost . " MAD";
        }

        // Finalize the Job
        $repair->status = 'Estimate Sent'; // Send back to client for final acceptance
        
        // Generate Invoice Number if not exists
        if (!$repair->invoice_number) {
            $repair->invoice_number = 'INV-' . strtoupper(uniqid()); 
        }
        
        $repair->save();

        return response()->json([
            'message' => $message,
            'repair' => new RepairResource($repair)
        ]);
    }

    public function deleteJob($id)
    {
         $repair = Repair::find($id);
         if($repair) {
             $repair->services()->detach(); 
             $repair->delete();
             return response()->json(['message' => 'Deleted']);
         }
         return response()->json(['message' => 'Not found'], 404);
    }

    public function getClientsWithRepairs()
    {
        $clients = User::whereHas('repairs')
            ->select(['id', 'name', 'email'])
            ->withCount('repairs')
            ->with(['vehicles:id,user_id,make,model,license_plate,type'])
            ->get();

        return response()->json($clients);
    }

    public function getClientRepairs($clientId)
    {
        $client = User::findOrFail($clientId);

        $repairs = Repair::whereHas('vehicle', function($q) use ($clientId) {
                $q->where('user_id', $clientId);
            })
            ->with(['vehicle', 'mechanic', 'services', 'parts']) 
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'client' => $client,
            'repairs' => RepairResource::collection($repairs)
        ]);
    }

    public function show($id)
    {
        $repair = Repair::with(['vehicle.client', 'mechanic', 'services'])->findOrFail($id);
        return new RepairResource($repair);
    }

    public function getInvoiceDetails($id)
    {
        $repair = Repair::with([
            'vehicle.client', 
            'mechanic', 
            'services', 
            'parts' 
        ])->findOrFail($id);

        return response()->json($repair);
    }

    public function invoice($id)
    {
        $repair = Repair::with([
            'vehicle.client', 
            'mechanic', 
            'services', 
            'parts' 
        ])->findOrFail($id);

        return new RepairResource($repair);
    }
}
