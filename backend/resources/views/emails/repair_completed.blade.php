<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Vehicle Ready</title>
</head>
<body style="background-color: #f3f4f6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; font-size: 16px; line-height: 1.6; margin: 0; padding: 0;">
    
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
            <td align="center">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
                    
                    <tr>
                        <td style="padding: 40px 40px 10px 40px;">
                            <h1 style="color: #2563eb; font-size: 24px; font-weight: 700; margin: 0;"> MecaPro Garage </h1>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 0 40px 40px 40px; color: #374151;">
                            <p style="margin-bottom: 20px;">Hello {{ $user->name }},</p>
                            
                            <p style="margin-bottom: 20px;">
                                Great news! The repairs on your <span style="color: black; font-weight: bold;"> {{ $repair->vehicle->make }} {{ $repair->vehicle->model }} </span> are officially complete.
                            </p>
                            
                            <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
                                <p style="margin: 0; font-size: 14px; color: #6b7280;">Total Amount Due:</p>
                                <p style="margin: 0; font-size: 24px; font-weight: bold; color: #111827;">${{ number_format($repair->cost, 2) }}</p>
                            </div>

                            <p style="margin-bottom: 24px;">
                                You can view your invoice details by clicking the button below:
                            </p>

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <a href="{{ $url }}" style="display: block; width: 100%; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; padding: 14px 0; border-radius: 6px; text-align: center;">
                                            View Invoice
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
                                Please visit our workshop to handle the payment and pick up your vehicle.
                            </p>

                            <p style="margin-top: 30px; margin-bottom: 0; color: #6b7280;">
                                — MecaPro Garage Team
                            </p>
                        </td>
                    </tr>
                </table>
                
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px;">
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