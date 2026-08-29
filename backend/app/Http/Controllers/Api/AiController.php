<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AiController extends Controller
{
    private string $flaskBaseUrl;

    public function __construct()
    {
        // Add to your .env: FLASK_API_URL=http://127.0.0.1:5001
        $this->flaskBaseUrl = env('FLASK_API_URL', 'http://127.0.0.1:5001');
    }

    /**
     * GET /api/ai/options  — PUBLIC
     * Returns all dropdown values for the React form.
     */
    public function options()
    {
        try {
            $response = Http::timeout(10)->get("{$this->flaskBaseUrl}/options");

            if ($response->failed()) {
                return response()->json(['error' => 'AI service unavailable'], 503);
            }

            return response()->json($response->json());

        } catch (\Exception $e) {
            return response()->json(['error' => 'Could not reach AI service: ' . $e->getMessage()], 503);
        }
    }

    /**
     * POST /api/ai/predict  — PUBLIC (used on homepage + client dashboard)
     * Sends vehicle info + symptoms to Flask, returns top 3 repair predictions.
     */
    public function predict(Request $request)
    {
        $validated = $request->validate([
            'vehicle_type'   => 'required|string',
            'make'           => 'required|string',
            'model'          => 'required|string',
            'year'           => 'required|integer|min:1990|max:2030',
            'mileage'        => 'required|integer|min:0',
            'fuel_type'      => 'required|string',
            'transmission'   => 'required|string',
            'engine_size_cc' => 'required|integer|min:50',
            'severity_level' => 'required|string',
            'symptoms'       => 'required|string',
            'probable_cause' => 'nullable|string',
        ]);

        try {
            $response = Http::timeout(15)
                ->post("{$this->flaskBaseUrl}/predict", $validated);

            if ($response->failed()) {
                return response()->json(['error' => 'AI prediction failed'], 503);
            }

            return response()->json($response->json());

        } catch (\Exception $e) {
            return response()->json(['error' => 'Could not reach AI service: ' . $e->getMessage()], 503);
        }
    }

    /**
     * GET /api/ai/health  — PUBLIC
     * Ping Flask to check if the AI service is alive.
     */
    public function health()
    {
        try {
            $response = Http::timeout(5)->get("{$this->flaskBaseUrl}/health");
            $alive = $response->successful();

            return response()->json([
                'ai_service' => $alive ? 'online' : 'offline',
            ], $alive ? 200 : 503);

        } catch (\Exception $e) {
            return response()->json(['ai_service' => 'offline'], 503);
        }
    }
}