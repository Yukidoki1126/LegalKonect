<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Update</title>
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
        .warning-badge {
            display: inline-block;
            background-color: #ef4444;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 20px;
        }
        h1 {
            color: #dc2626;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .info-box {
            background-color: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-box p {
            margin: 5px 0;
        }
        .info-box strong {
            color: #991b1b;
        }
        .reason-box {
            background-color: #fff7ed;
            border: 2px solid #fb923c;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        .reason-box h3 {
            color: #c2410c;
            margin-top: 0;
            font-size: 16px;
        }
        .reason-box p {
            margin: 10px 0 0 0;
            color: #7c2d12;
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
            <div class="warning-badge">⚠ VERIFICATION UPDATE</div>
        </div>

        <h1>Verification Status Update</h1>

        <p>Dear {{ $lawyerName }},</p>

        <p>Thank you for your interest in joining LegalKonect as a verified lawyer. After careful review of your submitted credentials, we regret to inform you that we are unable to approve your verification at this time.</p>

        <div class="info-box">
            <p><strong>✗ Verification Status:</strong> Not Approved</p>
            <p><strong>✗ Review Date:</strong> {{ now()->format('F j, Y - g:i A') }}</p>
        </div>

        <div class="reason-box">
            <h3>📋 Reason for Decision:</h3>
            <p>{{ $rejectionReason }}</p>
        </div>

        <div class="next-steps">
            <h3>🔄 What You Can Do:</h3>
            <ul>
                <li><strong>Review the Feedback:</strong> Carefully read the reason provided above</li>
                <li><strong>Update Your Documents:</strong> Ensure all credentials are clear, valid, and up-to-date</li>
                <li><strong>Resubmit for Verification:</strong> You can resubmit your verification documents after addressing the concerns</li>
                <li><strong>Contact Support:</strong> If you believe this is an error or need clarification, reach out to our support team</li>
            </ul>
        </div>

        <div style="text-align: center;">
            <a href="{{ env('FRONTEND_URL', 'http://localhost:5173') }}/lawyer/profile" class="button">
                Update Your Profile →
            </a>
        </div>

        <div class="info-box" style="background-color: #fffbeb; border-left-color: #f59e0b;">
            <p style="margin: 0;"><strong style="color: #d97706;">💡 Common Issues:</strong> Make sure your IBP number, Roll of Attorneys number, and PRC license are clearly visible, valid, and match the information in your profile.</p>
        </div>

        <div class="contact-info">
            <p><strong>Need Assistance?</strong></p>
            <p>Our support team is here to help you through the verification process.</p>
            <p>📧 Email: support@legalkonect.site</p>
            <p>📱 Available: Monday - Friday, 9 AM - 6 PM</p>
        </div>

        <div class="footer">
            <p>We appreciate your understanding and look forward to working with you once the verification requirements are met.</p>
            <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
                This is an automated message from LegalKonect.<br>
                © {{ date('Y') }} LegalKonect. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
