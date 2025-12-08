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
            background-color: #059669;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background-color: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
        }
        .success-box {
            background-color: #d1fae5;
            padding: 20px;
            margin: 20px 0;
            border: 2px solid #059669;
            border-radius: 4px;
            text-align: center;
        }
        .info-box {
            background-color: white;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #059669;
            border-radius: 4px;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            margin: 10px 5px;
            background-color: #059669;
            color: white;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            text-align: center;
        }
        ul {
            margin: 15px 0;
            padding-left: 20px;
        }
        li {
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 Congratulations!</h1>
    </div>

    <div class="content">
        <p>Dear {{ $lawyer->first_name }} {{ $lawyer->last_name }},</p>

        <div class="success-box">
            <h2 style="margin: 0; color: #059669;">Your Lawyer Account is Approved!</h2>
            <p style="margin: 10px 0 0 0; font-size: 14px;">Welcome to the LegalKonect lawyer community!</p>
        </div>

        <p>We're excited to inform you that your lawyer profile has been successfully verified and approved by our administrative team.</p>

        <div class="info-box">
            <h3 style="margin-top: 0; color: #059669;">What's Next?</h3>
            <ul>
                <li><strong>Your Profile is Live:</strong> Clients can now find and book appointments with you</li>
                <li><strong>Set Your Availability:</strong> Configure your schedule and available time slots</li>
                <li><strong>Manage Appointments:</strong> Review and accept client booking requests</li>
                <li><strong>Update Your Profile:</strong> Keep your specializations and bio up to date</li>
                <li><strong>Receive Payments:</strong> Set up your payment information to receive consultation fees</li>
            </ul>
        </div>

        @if($notes)
        <div style="background-color: #dbeafe; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <strong>Admin Notes:</strong>
            <p style="margin: 10px 0 0 0;">{{ $notes }}</p>
        </div>
        @endif

        <div style="background-color: #fef3c7; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <strong>💡 Tips for Success:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Complete your profile with detailed information about your expertise</li>
                <li>Upload professional profile photos and credentials</li>
                <li>Respond promptly to client inquiries and booking requests</li>
                <li>Maintain high-quality consultations to build positive reviews</li>
            </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.frontend_url') }}/lawyer/dashboard" class="button">Go to Your Dashboard</a>
        </div>

        <p>If you have any questions or need assistance getting started, please don't hesitate to contact our support team.</p>

        <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>The LegalKonect Team</strong>
        </p>
    </div>

    <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>&copy; {{ date('Y') }} LegalKonect. All rights reserved.</p>
    </div>
</body>
</html>
