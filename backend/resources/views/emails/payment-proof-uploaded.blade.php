<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Proof Uploaded</title>
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
            background-color: #f97316;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 20px;
        }
        h1 {
            color: #1e40af;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .info-box {
            background-color: #eff6ff;
            border-left: 4px solid #2563eb;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
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
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            padding: 12px 16px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 14px;
            color: #92400e;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">LegalKonect</div>
        </div>

        <div style="text-align: center;">
            <span class="alert-badge">⚡ Action Required</span>
        </div>

        <h1>Payment Proof Uploaded</h1>

        <p>Hello,</p>

        <p><strong>{{ $clientName }}</strong> has uploaded a payment proof for their upcoming appointment with you. Please review and verify the payment.</p>

        <div class="info-box">
            <div class="info-row">
                <span class="info-label">Client Name</span>
                <span class="info-value">{{ $clientName }}</span>
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
                <span class="info-label">Consultation Fee</span>
                <span class="info-value">₱{{ number_format($appointment->consultation_fee, 2) }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Payment Method</span>
                <span class="info-value">{{ $paymentMethod }}</span>
            </div>
        </div>

        <div class="warning">
            <strong>⏰ Please verify this payment soon.</strong> The client is waiting for your confirmation before the appointment can proceed.
        </div>

        <div style="text-align: center;">
            <a href="{{ config('app.frontend_url', 'http://localhost:5173') }}/lawyer/appointments" class="cta-button">
                View & Verify Payment
            </a>
        </div>

        <p>To verify the payment:</p>
        <ol>
            <li>Go to your Appointments page</li>
            <li>Find the appointment with {{ $clientName }}</li>
            <li>Click "View Receipt" to see the payment proof</li>
            <li>Confirm or reject the payment</li>
        </ol>

        <div class="footer">
            <p>This is an automated message from LegalKonect.</p>
            <p>© {{ date('Y') }} LegalKonect. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
