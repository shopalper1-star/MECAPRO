<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Models\User;
use App\Mail\ResetPasswordMail;

class ForgotPasswordController extends Controller
{
    public function sendResetLink(Request $request)
    {
        // 1. Validate that the email field is present
        $request->validate(['email' => 'required|email']);

        // 2. Find the user
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'We could not find a user with that email address.'], 404);
        }

        // 3. Generate a random secure token
        $token = Str::random(60);

        // 4. Store the token in the database
        // We delete any old tokens for this user first
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        DB::table('password_reset_tokens')->insert([
            'email' => $request->email,
            'token' => $token,
            'created_at' => Carbon::now()
        ]);

        // 5. Create the Link that points BACK to your React Frontend
        // IMPORTANT: Ensure this matches your React URL (usually localhost:5173)
        $resetUrl = "http://localhost:5173/reset-password/" . $token . "?email=" . urlencode($request->email);

        // 6. Send the Email
        try {
            Mail::to($request->email)->send(new ResetPasswordMail($resetUrl));
            return response()->json(['message' => 'Password reset link sent! Check your email.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Could not send email. Server error.'], 500);
        }
    }

    
    public function reset(Request $request)
    {
        // 1. Validate Data
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => ['required', 'string', 'confirmed', 'min:6'],
        ], [
            'password.min' => 'Password must be at least 6 characters.',
        ]);

        // 2. Check if Token Exists in DB
        $resetRecord = DB::table('password_reset_tokens')
                            ->where('email', $request->email)
                            ->where('token', $request->token)
                            ->first();

        if (!$resetRecord) {
            return response()->json(['message' => 'Invalid or expired token.'], 400);
        }

        // 3. Update User Password
        $user = User::where('email', $request->email)->first();
        
        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        $user->password = bcrypt($request->password);
        $user->save();

        // 4. Delete Token (so it can't be used again)
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Password reset successfully. You can now login.']);
    }
}