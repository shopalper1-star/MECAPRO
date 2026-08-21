<?php

namespace App\Http\Controllers\Api; // <--- CHANGED: Added \Api

use App\Http\Controllers\Controller; // <--- NEW: Need this to find the parent Controller
use Illuminate\Http\Request;
use App\Models\Service;

class ServiceController extends Controller
{
    public function index()
    {
        return response()->json(Service::all());
    }
}