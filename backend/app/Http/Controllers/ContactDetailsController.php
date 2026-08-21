<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ContactDetails;
use App\Mail\ContactMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class ContactDetailsController extends Controller
{
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'    => ['required', 'string', 'max:191', 'regex:/^[a-zA-Z\s]+$/'],
            'email'   => 'required|email|max:191',
            'phone'   => ['required', 'string', 'regex:/^\d{10,13}$/'],
            'message' => ['required', 'string', 'min:25', 'regex:/^[a-zA-Z0-9.,\s\r\n]*[a-zA-Z][a-zA-Z0-9.,\s\r\n]*$/'],
        ], [
            'name.regex' => 'Name must contain only alphabets and spaces.',
            'phone.regex' => 'Phone number must be between 10 and 13 digits, numbers only.',
            'message.regex' => 'Message must contain letters, and only use letters, numbers, periods, and commas.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 422,
                'errors' => $validator->messages()
            ], 422);
        }

        $contact = ContactDetails::create([
            'name'    => $request->name,
            'email'   => $request->email,
            'phone'   => $request->phone,
            'message' => $request->message,
        ]);

        if ($contact) {
            // Send the email
            Mail::to('mecapro.info@gmail.com')->send(new ContactMail([
                'name'    => $request->name,
                'email'   => $request->email,
                'phone'   => $request->phone,
                'message' => $request->message,
            ]));

            return response()->json([
                'status'  => 200,
                'message' => 'Message Sent Successfully'
            ], 200);
        } else {
            return response()->json([
                'status'  => 500,
                'message' => 'Something went wrong'
            ], 500);
        }
    }
}