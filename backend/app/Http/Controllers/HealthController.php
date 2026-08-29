<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class HealthController extends Controller
{
    public function check()
    {
        return response()->json([
            'status' => 'ok',
            'timestamp' => now(),
            'environment' => app()->environment()
        ]);
    }
}