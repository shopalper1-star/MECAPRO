<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\User;
use App\Models\Vehicle;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    /**
     * The four fixed daily time slots.
     */
    private const SLOTS = [
        ['time' => '08:00', 'label' => '08:00 AM'],
        ['time' => '10:00', 'label' => '10:00 AM'],
        ['time' => '14:00', 'label' => '02:00 PM'],
        ['time' => '16:00', 'label' => '04:00 PM'],
    ];

    /**
     * PUBLIC — GET /api/appointments/available-slots?date=YYYY-MM-DD
     * Returns slot availability for a given date.
     */
    public function availableSlots(Request $request)
    {
        $request->validate(['date' => 'required|date_format:Y-m-d']);
        $date = $request->input('date');

        $mechanicCount = User::where('role', 'mechanic')
            ->where('is_active', 1)
            ->count();

        // Slot capacity matches the exact number of mechanics available
        $capacity = $mechanicCount;

        $slots = [];
        $dayFull = true;

        foreach (self::SLOTS as $slot) {
            $booked = Appointment::where('preferred_date', $date)
                ->where('appointment_time', $slot['time'])
                ->whereNotIn('status', ['Declined', 'Canceled'])
                ->count();

            $available = $capacity > 0 && $booked < $capacity;
            if ($available) $dayFull = false;

            $slots[] = [
                'time'      => $slot['time'],
                'label'     => $slot['label'],
                'booked'    => $booked,
                'capacity'  => $capacity,
                'available' => $available,
            ];
        }

        return response()->json([
            'date'           => $date,
            'mechanic_count' => $mechanicCount,
            'slots'          => $slots,
            'day_full'       => $dayFull,
        ]);
    }

    /**
     * PUBLIC — GET /api/appointments/available-days
     * Returns availability summary and exact slots for the next 30 days.
     */
    public function availableDays(Request $request)
    {
        $mechanicCount = User::where('role', 'mechanic')
            ->where('is_active', 1)
            ->count();

        $capacity = $mechanicCount;
        $today    = Carbon::today();
        
        $start = $today->copy();
        $end   = $today->copy()->addDays(30);

        // Pre-fetch all appointment counts for the period in one query
        $counts = Appointment::whereBetween('preferred_date', [$start->toDateString(), $end->toDateString()])
            ->whereNotIn('status', ['Declined', 'Canceled'])
            ->selectRaw('preferred_date, appointment_time, COUNT(*) as total')
            ->groupBy('preferred_date', 'appointment_time')
            ->get()
            ->groupBy('preferred_date');

        $days = [];
        $current = $start->copy();

        while ($current->lte($end)) {
            $dateStr = $current->toDateString();
            $dayBookings = $counts->get($dateStr, collect())->keyBy('appointment_time');

            // Count how many slots are fully booked and build the slots array
            $fullSlots = 0;
            $daySlots = [];
            foreach (self::SLOTS as $slot) {
                $booked = $dayBookings->get($slot['time'])?->total ?? 0;
                $slotAvailable = $capacity > 0 && $booked < $capacity;
                if (!$slotAvailable) {
                    $fullSlots++;
                }
                
                $daySlots[] = [
                    'time'      => $slot['time'],
                    'label'     => $slot['label'],
                    'available' => $slotAvailable,
                ];
            }

            $available = $fullSlots < count(self::SLOTS);

            $days[] = [
                'date'      => $dateStr,
                'available' => $available,
                'slots'     => $daySlots,
            ];

            $current->addDay();
        }

        return response()->json([
            'days'  => $days,
        ]);
    }

    /**
     * Client creates an appointment request (PROTECTED)
     */
    public function store(Request $request)
    {
        $validTimes = ['08:00', '10:00', '14:00', '16:00'];

        $request->validate([
            'vehicle_id'       => 'nullable|exists:vehicles,id',
            'preferred_date'   => 'required|date|after_or_equal:today',
            'appointment_time' => 'required|in:08:00,10:00,14:00,16:00',
            'description'      => ['nullable', 'string', 'min:25', 'max:500', 'regex:/^[a-zA-Z0-9.,\s\r\n]*[a-zA-Z][a-zA-Z0-9.,\s\r\n]*$/'],
        ], [
            'description.regex'      => 'Description must contain letters, and only use letters, numbers, periods, and commas.',
            'appointment_time.in'    => 'Please select a valid time slot.',
            'appointment_time.required' => 'Please select a time slot.',
        ]);

        // Race condition guard — re-check slot availability
        $date       = $request->preferred_date;
        $time       = $request->appointment_time;
        $mechCount  = User::where('role', 'mechanic')
            ->where('is_active', 1)->count();
        $capacity   = $mechCount;

        $booked = Appointment::where('preferred_date', $date)
            ->where('appointment_time', $time)
            ->whereNotIn('status', ['Declined', 'Canceled'])
            ->count();

        if ($capacity === 0 || $booked >= $capacity) {
            return response()->json([
                'message' => 'This time slot is no longer available. Please choose another.',
            ], 422);
        }

        $appointment = Appointment::create([
            'user_id'          => $request->user()->id,
            'vehicle_id'       => $request->vehicle_id,
            'preferred_date'   => $date,
            'appointment_time' => $time,
            'description'      => $request->description,
            'status'           => 'Pending',
        ]);

        return response()->json([
            'message'     => 'Appointment request submitted successfully!',
            'appointment' => $appointment->load(['vehicle', 'client']),
        ], 201);
    }

    /**
     * Client views their own appointments
     */
    public function clientIndex(Request $request)
    {
        $appointments = Appointment::where('user_id', $request->user()->id)
            ->with(['vehicle', 'repair'])
            ->orderBy('preferred_date', 'asc')
            ->orderBy('appointment_time', 'asc')
            ->get();

        return response()->json([
            'data' => $appointments,
            'message' => 'Appointments retrieved successfully'
        ]);
    }

    /**
     * Receptionist views all appointments
     */
    public function receptionistIndex()
    {
        $appointments = Appointment::with(['client', 'vehicle', 'repair'])
            ->orderBy('preferred_date', 'asc')
            ->orderBy('appointment_time', 'asc')
            ->get();

        return response()->json([
            'data' => $appointments,
            'message' => 'Appointments retrieved successfully'
        ]);
    }

    /**
     * Receptionist approves an appointment
     */
    public function approve(Request $request, $id)
    {
        $appointment = Appointment::findOrFail($id);

        $appointment->status             = 'Approved';
        $appointment->receptionist_notes = $request->input('notes');
        $appointment->save();

        return response()->json([
            'message'     => 'Appointment approved.',
            'appointment' => $appointment,
        ]);
    }

    /**
     * Receptionist declines an appointment
     */
    public function decline(Request $request, $id)
    {
        $request->validate([
            'notes' => ['nullable', 'string', 'min:25', 'max:500', 'regex:/^[a-zA-Z0-9.,\s\r\n]*[a-zA-Z][a-zA-Z0-9.,\s\r\n]*$/'],
        ], [
            'notes.regex' => 'Notes must contain letters, and only use letters, numbers, periods, and commas.',
        ]);

        $appointment = Appointment::findOrFail($id);

        $appointment->status             = 'Declined';
        $appointment->receptionist_notes = $request->input('notes');
        $appointment->save();

        return response()->json([
            'message'     => 'Appointment declined.',
            'appointment' => $appointment,
        ]);
    }
}
