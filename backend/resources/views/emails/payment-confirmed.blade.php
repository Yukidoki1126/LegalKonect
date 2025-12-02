<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Confirmed</title>
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
            border-radius: 0 8px 8px 0;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #d1fae5;
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
        .success-icon {
            text-align: center;
            font-size: 48px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        .next-steps {
            background-color: #f0f9ff;
            border: 1px solid #0ea5e9;
            padding: 16px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .next-steps h3 {
            color: #0369a1;
            margin: 0 0 10px 0;
            font-size: 16px;
        }
        .next-steps ul {
            margin: 0;
            padding-left: 20px;
            color: #0c4a6e;
        }
        .next-steps li {
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
            <span class="success-badge">✓ Payment Verified</span>
        </div>

        <div class="success-icon">🎉</div>

        <h1>Your Payment Has Been Confirmed!</h1>

        <p>Great news! <strong>{{ $lawyerName }}</strong> has verified and confirmed your payment. Your appointment is now fully confirmed and ready to proceed.</p>

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
                <span class="info-label">Duration</span>
                <span class="info-value">{{ $appointment->duration_minutes }} minutes</span>
            </div>
            <div class="info-row">
                <span class="info-label">Reservation Fee Paid</span>
                <span class="info-value">₱{{ number_format($appointment->lawyer->reservation_fee ?? 100, 2) }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Status</span>
                <span class="info-value" style="color: #059669;">✓ Confirmed & Paid</span>
            </div>
        </div>

        <div class="next-steps">
            <h3>📋 What's Next?</h3>
            <ul>
                <li>Mark your calendar for the appointment date</li>
                <li>Prepare any documents or questions you want to discuss</li>
                <li>If it's a video consultation, ensure you have a stable internet connection</li>
                <li>Check your appointments page for the meeting link (if applicable)</li>
            </ul>
        </div>

        <div style="text-align: center;">
            <a href="{{ config('app.frontend_url', 'http://localhost:5173') }}/appointments" class="cta-button">
                View Your Appointments
            </a>
        </div>

        <div class="footer">
            <p>Thank you for choosing LegalKonect for your legal consultation needs.</p>
            <p>© {{ date('Y') }} LegalKonect. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
