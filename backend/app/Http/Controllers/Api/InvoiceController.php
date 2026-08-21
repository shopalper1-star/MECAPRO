<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Repair;
use App\Models\Invoice;
use Illuminate\Support\Str;

class InvoiceController extends Controller
{
    /**
     * Generate a Final Invoice for a Completed Job
     */
    public function generate(Request $request, $repairId)
    {
        $repair = Repair::with(['services', 'parts'])->findOrFail($repairId);

        // 1. Calculate Services Cost (Labor)
        $servicesCost = $repair->services->sum('price');

        // 2. Calculate Parts Cost (Quantity * Price)
        $partsCost = 0;
        foreach ($repair->parts as $part) {
            $partsCost += $part->pivot->price * $part->pivot->quantity;
        }

        // 3. Apply Discount (if any)
        $subtotal = $servicesCost + $partsCost;
        $discount = $repair->discount_amount ?? 0;
        $total = $subtotal - $discount;

        // 4. Create Invoice
        $invoice = Invoice::create([
            'repair_id' => $repair->id,
            'invoice_number' => 'INV-' . strtoupper(Str::random(8)),
            'total_amount' => $total,
            'status' => 'Unpaid'
        ]);

        return response()->json([
            'message' => 'Invoice generated successfully',
            'invoice' => $invoice,
            'breakdown' => [
                'labor' => $servicesCost,
                'parts' => $partsCost,
                'discount' => $discount,
                'total' => $total
            ]
        ]);
    }

    /**
     * Pay the Invoice
     */
public function pay(Request $request, $id)
    {
        $invoice = Invoice::findOrFail($id);
        $repair = $invoice->repair;

        if ($invoice->status === 'Paid') {
            return response()->json(['message' => 'Invoice is already paid.'], 400);
        }

        // Ensure the mechanic has actually finished the job
        if ($repair->status !== 'Completed') {
             return response()->json(['message' => 'Repair must be Completed before payment.'], 400);
        }

        // 1. Mark Invoice as Paid (Cash)
        $invoice->update([
            'status' => 'Paid',
            'paid_amount' => $invoice->total_amount,
            'paid_at' => now()
        ]);

        // 2. Mark Repair as Delivered (Vehicle leaves the garage)
        $repair->update(['status' => 'Delivered']);

        return response()->json([
            'message' => 'Payment received in Cash. Vehicle has been Delivered.',
            'invoice_status' => 'Paid',
            'repair_status' => 'Delivered'
        ]);
    }
}