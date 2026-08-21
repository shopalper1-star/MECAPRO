<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>New Contact Message</title>
</head>
<body style="background-color: #f3f4f6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; font-size: 16px; line-height: 1.6; margin: 0; padding: 0;">

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
            <td align="center">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 700px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">

                    <tr>
                        <td style="padding: 40px 40px 10px 40px;">
                            <h1 style="color: #2563eb; font-size: 24px; font-weight: 700; margin: 0;">MecaPro Garage</h1>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 0 40px 40px 40px; color: #374151;">
                            <p style="margin-bottom: 20px;">Hello,</p>

                            <p style="margin-bottom: 24px;">
                                You have received a new contact message submitted through the <span style="color: black; font-weight: bold;">MecaPro</span> website. Here are the details:
                            </p>

                            <!-- Contact Details Table -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; margin-bottom: 24px;">
                                <tr style="background-color: #2563eb;">
                                    <td style="padding: 10px 16px; color: #ffffff; font-weight: 600; font-size: 13px; width: 25%;">Field</td>
                                    <td style="padding: 10px 16px; color: #ffffff; font-weight: 600; font-size: 13px;">Details</td>
                                </tr>
                                <tr style="background-color: #f9fafb;">
                                    <td style="padding: 12px 16px; color: #2563eb; font-weight: 600; font-size: 14px; border-bottom: 1px solid #e5e7eb; white-space: nowrap;">Full Name</td>
                                    <td style="padding: 12px 16px; color: #374151; font-size: 14px; border-bottom: 1px solid #e5e7eb;">{{ $contactData['name'] }}</td>
                                </tr>
                                <tr style="background-color: #ffffff;">
                                    <td style="padding: 12px 16px; color: #2563eb; font-weight: 600; font-size: 14px; border-bottom: 1px solid #e5e7eb; white-space: nowrap;">Email</td>
                                    <td style="padding: 12px 16px; color: #374151; font-size: 14px; border-bottom: 1px solid #e5e7eb;">{{ $contactData['email'] }}</td>
                                </tr>
                                <tr style="background-color: #f9fafb;">
                                    <td style="padding: 12px 16px; color: #2563eb; font-weight: 600; font-size: 14px; border-bottom: 1px solid #e5e7eb; white-space: nowrap;">Phone</td>
                                    <td style="padding: 12px 16px; color: #374151; font-size: 14px; border-bottom: 1px solid #e5e7eb;">{{ $contactData['phone'] }}</td>
                                </tr>
                                <tr style="background-color: #ffffff;">
                                    <td style="padding: 12px 16px; color: #2563eb; font-weight: 600; font-size: 14px; border-bottom: 1px solid #e5e7eb; white-space: nowrap; vertical-align: top;">Message</td>
                                    <td style="padding: 12px 16px; color: #374151; font-size: 14px; border-bottom: 1px solid #e5e7eb; white-space: pre-wrap; line-height: 1.7;">{{ $contactData['message'] }}</td>
                                </tr>
                                <tr style="background-color: #f9fafb;">
                                    <td style="padding: 12px 16px; color: #2563eb; font-weight: 600; font-size: 14px; white-space: nowrap;">Received At</td>
                                    <td style="padding: 12px 16px; color: #374151; font-size: 14px;">{{ now()->format('D, d M Y - H:i') }}</td>
                                </tr>
                            </table>

                            <p style="margin-top: 10px; font-size: 14px; color: #6b7280;">
                                Please follow up with this client as soon as possible.
                            </p>

                            <p style="margin-top: 30px; margin-bottom: 0; color: #6b7280;">
                                — MecaPro Garage Team
                            </p>
                        </td>
                    </tr>
                </table>

                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 700px;">
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