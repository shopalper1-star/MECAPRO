<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class SupervisorController extends Controller
{
    /**
     * Get all mechanics and receptionists
     */
    public function index()
    {
        $staff = User::whereIn('role', ['mechanic', 'receptionist'])->get();
        return response()->json($staff);
    }

    /**
     * Create a new staff member (mechanic/receptionist)
     */
    public function store(Request $request)
    {
        $fields = $request->validate([
            'name' => ['required', 'string', 'max:255', 'regex:/^[a-zA-Z\s]+$/'],
            'email' => 'required|string|email|unique:users,email',
            'password' => ['required', 'string', 'min:6'],
            'role' => 'required|string|in:mechanic,receptionist',
            'phone' => ['nullable', 'string', 'regex:/^\d{10,13}$/']
        ], [
            'name.regex' => 'Name must contain only alphabets and spaces.',
            'password.min' => 'Password must be at least 6 characters.',
            'phone.regex' => 'Phone number must be between 10 and 13 digits, numbers only.',
        ]);

        $user = User::create([
            'name' => $fields['name'],
            'email' => $fields['email'],
            'password' => Hash::make($fields['password']),
            'role' => $fields['role'],
            'phone' => $fields['phone'] ?? null,
            'is_verified' => true, // Assuming supervisor created accounts are auto-verified
            'is_active' => true,
        ]);

        return response()->json([
            'message' => ucfirst($fields['role']) . ' created successfully',
            'user' => $user
        ], 201);
    }

    /**
     * Update an existing staff member
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $fields = $request->validate([
            'name' => ['sometimes', 'string', 'max:255', 'regex:/^[a-zA-Z\s]+$/'],
            'email' => 'sometimes|string|email|unique:users,email,' . $user->id,
            'password' => ['sometimes', 'string', 'min:6'], // Optional password update
            'phone' => ['nullable', 'string', 'regex:/^\d{10,13}$/']
        ], [
            'name.regex' => 'Name must contain only alphabets and spaces.',
            'password.min' => 'Password must be at least 6 characters.',
            'phone.regex' => 'Phone number must be between 10 and 13 digits, numbers only.',
        ]);

        $updateData = [
            'name' => $fields['name'] ?? $user->name,
            'email' => $fields['email'] ?? $user->email,
            'phone' => $fields['phone'] ?? $user->phone,
        ];

        // Only hash and update password if provided
        if (!empty($fields['password'])) {
            $updateData['password'] = Hash::make($fields['password']);
        }

        $user->update($updateData);

        return response()->json([
            'message' => 'Staff member updated successfully',
            'user' => $user
        ]);
    }

    /**
     * Prevent a user from logging in by setting is_active to false
     */
    public function toggleStatus($id)
    {
        $user = User::findOrFail($id);
        
        // Prevent disabling a supervisor (or another supervisor logic)
        if ($user->role === 'supervisor') {
             return response()->json(['message' => 'Cannot modify supervisor status'], 403);
        }

        $user->is_active = !$user->is_active;
        $user->save();

        $status = $user->is_active ? 'enabled' : 'disabled';

        return response()->json([
            'message' => "User account has been $status",
            'is_active' => $user->is_active
        ]);
    }
}
