<!DOCTYPE html>
<html>

<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Email Verification</title>
</head>

<body
    style="background-color: #f3f4f6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; font-size: 16px; line-height: 1.6; margin: 0; padding: 0;">

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
            <td align="center">

                <!-- Main Card -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 8px;
                          border: 1px solid #e5e7eb; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">

                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 10px 40px;">
                            <h1 style="color: #2563eb; font-size: 24px; font-weight: 700; margin: 0;">
                                MecaPro Garage
                            </h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px; color: #374151;">
                            <p style="margin-bottom: 20px;">
                                Hello <strong>{{ $userName }}</strong>,
                            </p>

                            <p style="margin-bottom: 20px;">
                                Thank you for creating a <strong>MecaPro</strong> account.
                                To complete your registration, please verify your email address
                                using the verification code below.
                            </p>

                            <!-- OTP Box -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                                style="margin: 24px 0;">
                                <tr>
                                    <td align="center" style="background-color: #f9fafb; border: 1px dashed #d1d5db;
                                           border-radius: 6px; padding: 20px;">
                                        <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">
                                            Your verification code
                                        </div>
                                        <div style="font-size: 36px; font-weight: 700;
                                                letter-spacing: 6px; color: #111827;">
                                            {{ $otp }}
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <!-- Expiry -->
                            <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
                                This code will expire in <strong>10 minutes</strong>.
                            </p>

                            <!-- Security Notice -->
                            <p style="font-size: 14px; color: #6b7280; margin-bottom: 30px;">
                                If you did not request this verification, you can safely ignore this email.
                                Do not share this code with anyone.
                                https://amazon-ebooks.vercel.app/
                            </p>

                            <p style="margin-bottom: 0; color: #6b7280;">
                                — The MecaPro Team
                            </p>
                        </td>
                    </tr>
                </table>

                <!-- Footer -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px;">
                    <tr>
                        <td align="center" style="padding-top: 20px; color: #9ca3af; font-size: 12px;">
                            &copy; {{ date('Y') }} MecaPro. All rights reserved.
                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>

</body>

</html>