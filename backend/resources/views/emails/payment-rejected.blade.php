<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Verification Failed</title>
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
        .alert-badge {
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
            border-radius: 0 8px 8px 0;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #fecaca;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            color: #6b7280;
            font-weight: 500;
        }
        .info-value {
            color: #1f2937;
            font-weight: 600;
        }
        .cta-button {
            display: inline-block;
            background-color: #2563eb;
            color: white !important;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
        }
        .cta-button:hover {
            background-color: #1d4ed8;
        }
        .reason-box {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            padding: 16px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .reason-box h3 {
            color: #92400e;
            margin: 0 0 10px 0;
            font-size: 16px;
        }
        .reason-box p {
            color: #78350f;
            margin: 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        .steps {
            background-color: #f0f9ff;
            border: 1px solid #0ea5e9;
            padding: 16px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .steps h3 {
            color: #0369a1;
            margin: 0 0 10px 0;
            font-size: 16px;
        }
        .steps ol {
            margin: 0;
            padding-left: 20px;
            color: #0c4a6e;
        }
        .steps li {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">LegalKonect</div>
        </div>

        <div style="text-align: center;">
            <span class="alert-badge">⚠️ Action Required</span>
        </div>

        <h1>Payment Verification Failed</h1>

        <p>Unfortunately, <strong>{{ $lawyerName }}</strong> was unable to verify your payment proof for the upcoming appointment. Please upload a new payment receipt to confirm your booking.</p>

        <div class="reason-box">
            <h3>📝 Reason for Rejection</h3>
            <p>{{ $reason }}</p>
        </div>

        <div class="info-box">
            <div class="info-row">
                <span class="info-label">Lawyer</span>
                <span class="info-value">{{ $lawyerName }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Appointment Date</span>
                <span class="info-value">{{ \Carbon\Carbon::parse($appointment->appointment_date)->format('F d, Y') }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Appointment Time</span>
                <span class="info-value">{{ \Carbon\Carbon::parse($appointment->appointment_time)->format('g:i A') }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Amount Due</span>
                <span class="info-value">₱{{ number_format($appointment->consultation_fee, 2) }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Status</span>
                <span class="info-value" style="color: #dc2626;">⚠️ Payment Pending</span>
            </div>
        </div>

        <div class="steps">
            <h3>📋 What to Do Next</h3>
            <ol>
                <li>Ensure your payment has been successfully processed</li>
                <li>Take a clear screenshot of your payment confirmation/receipt</li>
                <li>Go to your appointment payment page</li>
                <li>Upload the new payment proof</li>
                <li>Wait for the lawyer to verify your payment</li>
            </ol>
        </div>

        <div style="text-align: center;">
            <a href="{{ config('app.frontend_url', 'http://localhost:5173') }}/appointments" class="cta-button">
                View Appointment & Upload New Receipt
            </a>
        </div>

        <p style="text-align: center; color: #6b7280; font-size: 14px;">
            If you believe this was an error or need assistance, please contact our support team.
        </p>

        <div class="footer">
            <p>This is an automated message from LegalKonect.</p>
            <p>© {{ date('Y') }} LegalKonect. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
