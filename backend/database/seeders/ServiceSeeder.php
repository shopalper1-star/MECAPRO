<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Service;

class ServiceSeeder extends Seeder
{
    public function run()
    {
        $services = [
            // --- DIAGNOSTIC ---
            ['name' => 'General Diagnostic', 'zone' => 'diagnostic', 'price' => 50], // Base diagnostic fee
            
            // --- ENGINE ZONE ---
            ['name' => 'Oil Change', 'zone' => 'engine', 'price' => 450],
            ['name' => 'Battery Change', 'zone' => 'engine', 'price' => 1000],
            ['name' => 'Engine Diagnostics', 'zone' => 'engine', 'price' => 280],
            ['name' => 'Transmission Services', 'zone' => 'engine', 'price' => 2700],
            ['name' => 'Clutch Repair', 'zone' => 'engine', 'price' => 3200],
            ['name' => 'Radiator Services', 'zone' => 'engine', 'price' => 800],
            ['name' => 'A/C Services', 'zone' => 'engine', 'price' => 1200],
            ['name' => 'Fuel System Services', 'zone' => 'engine', 'price' => 1100],
            ['name' => 'Engine Cleaning', 'zone' => 'engine', 'price' => 200],

            // --- WHEELS ZONE ---
            ['name' => 'Brake Services', 'zone' => 'wheels', 'price' => 1400],
            ['name' => 'Tire Services', 'zone' => 'wheels', 'price' => 1200],
            ['name' => 'Suspension & Steering', 'zone' => 'wheels', 'price' => 1250],
            ['name' => 'Wheel Alignment', 'zone' => 'wheels', 'price' => 280],

            // --- EXHAUST ZONE ---
            ['name' => 'Emissions Testing', 'zone' => 'exhaust', 'price' => 300],
            ['name' => 'Exhaust System Repair', 'zone' => 'exhaust', 'price' => 780],

            // --- LIGHTS ZONE ---
            ['name' => 'Electrical Repair (Lights)', 'zone' => 'lights', 'price' => 250],
            
            // --- BODY ZONE ---
            ['name' => 'Electrical Diagnostics', 'zone' => 'body', 'price' => 245],
            ['name' => 'Safety Inspection', 'zone' => 'body', 'price' => 250],
        ];

        foreach ($services as $s) {
            Service::create($s);
        }
    }
}