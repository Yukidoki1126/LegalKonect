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
            background-color: #2563eb;
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
        .button:hover {
            background-color: #1d4ed8;
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
        .link-text {
            word-break: break-all;
            font-size: 12px;
            color: #6b7280;
            margin-top: 15px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔐 Reset Your Password</h1>
    </div>
    
    <div class="content">
        <div class="message">
            <p>Hello <strong>{{ $user->name }}</strong>,</p>
            
            <p>We received a request to reset the password for your LegalKonect account. Click the button below to create a new password:</p>
            
            <div class="button-container">
                <a href="{{ $resetLink }}" class="button">Reset Password</a>
            </div>
            
            <div class="warning">
                <strong>⏰ Important:</strong> This link will expire in <strong>1 hour</strong> for security reasons.
            </div>
            
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            
            <p class="link-text">
                If the button doesn't work, copy and paste this link into your browser:<br>
                {{ $resetLink }}
            </p>
        </div>
    </div>
    
    <div class="footer">
        <p>This is an automated message from LegalKonect.</p>
        <p>Please do not reply to this email.</p>
        <p>&copy; {{ date('Y') }} LegalKonect. All rights reserved.</p>
    </div>
</body>
</html>
