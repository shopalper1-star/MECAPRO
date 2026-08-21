<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Reset Password</title>
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
                            <p style="margin-bottom: 20px;">Hello,</p>
                            
                            <p style="margin-bottom: 20px;">
                                We've received a request to reset the password for the <span style="color: black; font-weight: bold;"> MecaPro </span> account associated with your email address. No changes have been made to your account yet.
                            </p>
                            
                            <p style="margin-bottom: 24px;">
                                You can reset your password by clicking the link below:
                            </p>

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <a href="{{ $url }}" style="display: block; width: 100%; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; padding: 14px 0; border-radius: 6px; text-align: center;">
                                            Reset your password
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
                                If you did not request a new password, please let us know immediately by replying to this email.
                            </p>

                            <p style="margin-top: 10px; font-size: 14px; color: #6b7280;">
                                Do not share this Link with anyone.
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