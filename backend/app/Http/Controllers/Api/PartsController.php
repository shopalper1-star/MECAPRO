<?php

namespace App\Http\Controllers\Api;
use App\Models\Repair;
use App\Models\Part;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class PartsController extends Controller
{

    public function getInvoice($id)
    {
        // Eager load everything needed for the paper invoice
        $repair = Repair::with([
            'vehicle.client', // Get Vehicle AND the Owner
            'service',        // Get the Service Name
            'parts'           // Get the Parts with Pivot (Price & Qty)
        ])->findOrFail($id);

        return response()->json($repair);
    }

    
    public function addPart(Request $request, $id)
    {

        // 1. Validate Input
        $request->validate([
            'part_id' => 'required|exists:parts,id',
            'quantity' => 'required|integer|min:1'
        ]);

        // 2. Find the Repair and the Part
        $repair = Repair::findOrFail($id);
        $part = Part::findOrFail($request->part_id);

        // 3. Check if this part is ALREADY on this repair
        // (We don't want duplicate rows for the same part, just more quantity)
        $existingPart = $repair->parts()->where('part_id', $part->id)->first();

        if ($existingPart) {
            // SCENARIO A: Part exists, just increase quantity
            $newQuantity = $existingPart->pivot->quantity + $request->quantity;
            
            $repair->parts()->updateExistingPivot($part->id, [
                'quantity' => $newQuantity
                // Note: We do NOT update the price here. We keep the price 
                // valid from when the first item was added (protects the quote).
            ]);
            
            $message = "Quantity updated successfully.";
        } else {
            // SCENARIO B: New Part - The "Price Freeze" Moment
            $repair->parts()->attach($part->id, [
                'quantity' => $request->quantity,
                'price' => $part->price // <--- THIS SAVES THE CURRENT PRICE FOREVER
            ]);
            
            $message = "Part added successfully.";
        }

        return response()->json([
            'message' => $message,
            'parts' => $repair->parts // Return updated list so frontend can refresh immediately
        ]);
    }

}
