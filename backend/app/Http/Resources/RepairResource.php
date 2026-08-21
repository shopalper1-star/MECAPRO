<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RepairResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // 1. Prepare services collection
        $allServices = $this->services ?? collect([]);
        $primaryService = $allServices->first();

        return [
            'id' => $this->id,
            'description' => $this->description,
            'cost' => $this->cost,
            'status' => $this->status,
            'date_end' => $this->date_end,
            'invoice_number' => $this->invoice_number,
            'created_at' => $this->created_at,
            'is_diagnostic' => $this->is_diagnostic ?? false,
            'negotiation_count' => $this->negotiation_count ?? 0,
            'original_cost' => $this->original_cost,

            // --- VEHICLE (Hyper-Safe Check) ---
            'vehicle' => $this->vehicle ? [
                'id' => $this->vehicle->id,
                'make' => $this->vehicle->make,
                'model' => $this->vehicle->model,
                'type' => $this->vehicle->type, // Added type
                'year' => $this->vehicle->year,
                'plate_number' => $this->vehicle->plate_number ?? $this->vehicle->license_plate ?? 'N/A',
                'client_id' => $this->vehicle->client_id ?? $this->vehicle->user_id ?? null,
                'owner_name' => ($this->vehicle->client) ? $this->vehicle->client->name : 'Guest'
            ] : null,

            // --- MECHANIC ---
            'mechanic' => $this->mechanic ? [
                'id' => $this->mechanic->id,
                'name' => $this->mechanic->name,
            ] : null,

            // --- ALL SERVICES (Used by History/Lists) ---
            'services' => $allServices->map(function($service) {
                return [
                    'id' => $service->id,
                    'name' => $service->name,
                    'zone' => $service->zone ?? 'general',
                    'price' => $service->pivot->price_at_booking ?? $service->price,
                    'original_price' => $service->price,
                ];
            }),

            // --- SINGLE SERVICE (For legacy UI support) ---
            'service' => $primaryService ? [
                'id' => $primaryService->id,
                'name' => $primaryService->name,
                'zone' => $primaryService->zone ?? 'general',
                'price' => $primaryService->price,
            ] : [
                'id' => 0,
                'name' => 'Custom Repair',
                'zone' => 'body',
                'price' => 0
            ],
            
            // --- PARTS (If loaded) ---
            'parts' => $this->whenLoaded('parts', function() {
                return $this->parts->map(function($part) {
                    return [
                        'id' => $part->id,
                        'name' => $part->name,
                        'cost' => $part->cost,
                        'quantity' => $part->pivot->quantity ?? 1,
                        'price' => $part->pivot->price ?? $part->price,
                        'original_price' => $part->price,
                    ];
                });
            }),
        ];
    }
}