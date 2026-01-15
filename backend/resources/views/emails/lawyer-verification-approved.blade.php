<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Approved</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
        }
        .success-badge {
            display: inline-block;
            background-color: #10b981;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 20px;
        }
        h1 {
            color: #059669;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .info-box {
            background-color: #ecfdf5;
            border-left: 4px solid #10b981;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-box p {
            margin: 5px 0;
        }
        .info-box strong {
            color: #047857;
        }
        .next-steps {
            background-color: #f0f9ff;
            border-left: 4px solid #2563eb;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .next-steps h3 {
            color: #1e40af;
            margin-top: 0;
            font-size: 18px;
        }
        .next-steps ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .next-steps li {
            margin: 8px 0;
        }
        .button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
        }
        .button:hover {
            background-color: #1d4ed8;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
        }
        .contact-info {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .contact-info p {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">⚖️ LegalKonect</div>
            <div class="success-badge">✓ VERIFIED</div>
        </div>

        <h1>🎉 Congratulations, {{ $lawyerName }}!</h1>

        <p>We're thrilled to inform you that your verification has been <strong>approved</strong>! You are now an official verified lawyer on LegalKonect.</p>

        <div class="info-box">
            <p><strong>✓ Verification Status:</strong> Approved</p>
            <p><strong>✓ Profile Status:</strong> Active</p>
            <p><strong>✓ Date Verified:</strong> {{ now()->format('F j, Y - g:i A') }}</p>
            @if($verificationNotes)
            <p><strong>✓ Admin Notes:</strong> {{ $verificationNotes }}</p>
            @endif
        </div>

        <div class="next-steps">
            <h3>📋 Next Steps to Get Started:</h3>
            <ul>
                <li><strong>Complete Your Profile:</strong> Add a professional photo, update your bio, and highlight your expertise</li>
                <li><strong>Set Your Availability:</strong> Configure your schedule and consultation hours</li>
                <li><strong>Set Your Rates:</strong> Define your hourly rate and reservation fee</li>
                <li><strong>Connect Google Calendar:</strong> Sync your appointments automatically</li>
                <li><strong>Set Up Payment Details:</strong> Configure your payout method (GCash or Bank)</li>
            </ul>
        </div>

        <div style="text-align: center;">
            <a href="{{ env('FRONTEND_URL', 'http://localhost:5173') }}/lawyer/dashboard" class="button">
                Go to Your Dashboard →
            </a>
        </div>

        <div class="info-box" style="background-color: #fffbeb; border-left-color: #f59e0b;">
            <p style="margin: 0;"><strong style="color: #d97706;">💡 Pro Tip:</strong> Clients are more likely to book lawyers with complete profiles and good availability. Make sure to keep your schedule updated!</p>
        </div>

        <div class="contact-info">
            <p><strong>Need Help Getting Started?</strong></p>
            <p>Our support team is here to help you succeed on LegalKonect.</p>
            <p>📧 Email: support@legalkonect.site</p>
            <p>📱 Available: Monday - Friday, 9 AM - 6 PM</p>
        </div>

        <div class="footer">
            <p>Welcome to the LegalKonect family! We're excited to have you on board.</p>
            <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
                This is an automated message from LegalKonect.<br>
                © {{ date('Y') }} LegalKonect. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
