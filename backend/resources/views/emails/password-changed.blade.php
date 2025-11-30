<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #10b981;
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            background-color: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
        }
        .message {
            background-color: white;
            padding: 25px;
            margin: 20px 0;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .success-icon {
            text-align: center;
            font-size: 48px;
            margin-bottom: 15px;
        }
        .button {
            display: inline-block;
            background-color: #2563eb;
            color: white !important;
            padding: 14px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
        }
        .button-container {
            text-align: center;
            margin: 25px 0;
        }
        .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            color: #92400e;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            font-size: 14px;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>✅ Password Changed Successfully</h1>
    </div>
    
    <div class="content">
        <div class="message">
            <div class="success-icon">🔒</div>
            
            <p>Hello <strong>{{ $user->name }}</strong>,</p>
            
            <p>Your password has been successfully changed. You can now log in to your LegalKonect account using your new password.</p>
            
            <div class="button-container">
                <a href="{{ config('app.frontend_url', 'http://localhost:3000') }}/login" class="button">Login to Your Account</a>
            </div>
            
            <div class="warning">
                <strong>🚨 Didn't make this change?</strong><br>
                If you did not change your password, please contact our support team immediately at <a href="mailto:support@legalkonect.com">support@legalkonect.com</a>. Your account may have been compromised.
            </div>
        </div>
    </div>
    
    <div class="footer">
        <p>This is an automated message from LegalKonect.</p>
        <p>Please do not reply to this email.</p>
        <p>&copy; {{ date('Y') }} LegalKonect. All rights reserved.</p>
    </div>
</body>
</html>
