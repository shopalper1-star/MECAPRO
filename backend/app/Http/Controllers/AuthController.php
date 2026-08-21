<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\EmailVerification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use App\Mail\OtpMail;

class AuthController extends Controller
{
    // 1. REGISTER USER (With OTP in separate table)
    public function register(Request $request)
    {
        $fields = $request->validate([
            'name' => ['required', 'string', 'max:255', 'regex:/^[a-zA-Z\s]+$/'],
            'email' => 'required|string|email|unique:users,email',
            'password' => ['required', 'string', 'confirmed', 'min:6'],
            'role' => 'sometimes|string|in:client,mechanic,supervisor,receptionist,parts_manager'
        ], [
            'name.regex' => 'Name must contain only alphabets and spaces.',
            'password.min' => 'Password must be at least 6 characters.',
        ]);

        // Create the user (NOT verified yet)
        $user = User::create([
            'name' => $fields['name'],
            'email' => $fields['email'],
            'password' => Hash::make($fields['password']),
            'role' => $request->role ?? 'client',
            'is_verified' => false,
        ]);

        // Generate 6-digit OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Delete any existing OTP for this email (cleanup)
        EmailVerification::where('email', $user->email)->delete();

        // Store OTP in separate table
        EmailVerification::create([
            'email' => $user->email,
            'otp' => $otp,
            'expires_at' => now()->addMinutes(10),
        ]);

        // Send OTP email using custom view
        try {
            Mail::to($user->email)->send(new OtpMail($user->name, $otp));
        } catch (\Exception $e) {
            // If email fails, cleanup user and OTP
            $user->delete();
            EmailVerification::where('email', $user->email)->delete();
            
            return response()->json([
                'message' => 'Failed to send verification email. Please try again.',
                'error' => $e->getMessage()
            ], 500);
        }

        return response()->json([
            'message' => 'Registration successful! Please check your email for the verification code.',
            'email' => $user->email,
        ], 201);
    }

    // 2. VERIFY OTP
    public function verifyemail(Request $request)
{
    $request->validate([
        'email' => 'required|email',
        'otp' => 'required|string|size:6'
    ]);

    // Find user
    $user = User::where('email', $request->email)->first();

    if (!$user) {
        return response()->json(['message' => 'User not found.'], 404);
    }

    // Check if already verified
    if ($user->is_verified) {
        return response()->json(['message' => 'Email already verified. Please login.'], 400);
    }

    // Find OTP record
    $otpRecord = EmailVerification::where('email', $request->email)
        ->latest()
        ->first();

    if (!$otpRecord) {
        return response()->json(['message' => 'No verification code found. Please request a new one.'], 404);
    }

    // Check if expired
    if ($otpRecord->isExpired()) {
        $otpRecord->delete();
        return response()->json(['message' => 'Verification code has expired. Please request a new one.'], 400);
    }

    // Validate OTP
    if (!$otpRecord->isValid($request->otp)) {
        return response()->json(['message' => 'Invalid verification code.'], 400);
    }

    // Mark user as verified
    $user->is_verified = true; // ✅ Try direct assignment
    $user->email_verified_at = now();
    $user->save(); // ✅ Use save() instead of update()

    // Delete the OTP record (one-time use)
    $otpRecord->delete();

    return response()->json([
        'message' => 'Email verified successfully! You can now login.',
        'user' => $user
    ], 200);
}

    // 3. RESEND OTP
    public function resendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email'
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        if ($user->is_verified) {
            return response()->json(['message' => 'Email already verified. Please login.'], 400);
        }

        // Generate new OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Delete old OTP and create new one
        EmailVerification::where('email', $user->email)->delete();
        
        EmailVerification::create([
            'email' => $user->email,
            'otp' => $otp,
            'expires_at' => now()->addMinutes(10),
        ]);

        // Send new OTP email
        try {
            Mail::to($user->email)->send(new OtpMail($user->name, $otp));
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to send verification email.',
                'error' => $e->getMessage()
            ], 500);
        }

        return response()->json([
            'message' => 'New verification code sent to your email.'
        ], 200);
    }

    // 4. LOGIN USER (Check verification)
    public function login(Request $request)
{
    $fields = $request->validate([
        'email' => 'required|string|email',
        'password' => 'required|string'
    ]);

    $user = User::where('email', $fields['email'])->first();

    if (!$user || !Hash::check($fields['password'], $user->password)) {
        return response()->json(['message' => 'Bad credentials'], 401);
    }

    // ✅ Refresh user from database to ensure latest data
    $user->refresh();

    // Check if account is disabled (is_active = false)
    if (!$user->is_active) {
        return response()->json([
            'message' => 'Your account has been disabled. Please contact the supervisor.',
            'is_active' => false
        ], 403);
    }



    // Check if email is verified
    if (!$user->is_verified) {
        return response()->json([
            'message' => 'Please verify your email before logging in.',
            'email' => $user->email,
            'requires_verification' => true
        ], 403);
    }

    $token = $user->createToken('myapptoken')->plainTextToken;

    return response()->json([
        'user' => $user,
        'token' => $token
    ], 200);
}

    // 5. CHANGE PASSWORD
    public function changePassword(Request $request)
    {
        $request->validate([
            'currentPassword' => 'required',
            'newPassword' => ['required', 'confirmed', 'min:6'],
        ], [
            'newPassword.min' => 'Password must be at least 6 characters.',
        ]);

        $user = $request->user();

        if (!Hash::check($request->currentPassword, $user->password)) {
            return response()->json([
                'message' => 'The provided current password is incorrect.'
            ], 400);
        }

        $user->update([
            'password' => Hash::make($request->newPassword)
        ]);

        return response()->json([
            'message' => 'Password updated successfully!'
        ], 200);
    }

    // 6. LOGOUT USER
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out']);
    }

    public function user(Request $request)
    {
        return $request->user();
    }

    // 7. CREATE STAFF (Keep your existing method)
    public function createStaff(Request $request)
    {
        // Add your existing createStaff logic here if you have one
        // Otherwise you can remove this method
    }
}
