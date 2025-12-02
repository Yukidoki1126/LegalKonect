<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Appointment Booking</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .email-wrapper {
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 14px;
        }
        .content {
            padding: 30px;
        }
        .greeting {
            font-size: 18px;
            color: #1a1a1a;
            margin-bottom: 20px;
        }
        .message {
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
            border-left: 4px solid #10b981;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
        }
        .message p {
            margin: 0;
            color: #065f46;
            font-weight: 500;
        }
        .info-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .info-box h3 {
            margin: 0 0 15px 0;
            color: #1e40af;
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .label {
            color: #64748b;
            font-size: 14px;
        }
        .value {
            color: #1a1a1a;
            font-weight: 600;
            font-size: 14px;
        }
        .client-box {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            border: 1px solid #93c5fd;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .client-box h3 {
            margin: 0 0 15px 0;
            color: #1e40af;
            font-size: 16px;
        }
        .fee-box {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 1px solid #fbbf24;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .fee-box h3 {
            margin: 0 0 15px 0;
            color: #92400e;
            font-size: 16px;
        }
        .status-badge {
            display: inline-block;
            padding: 6px 16px;
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            color: #92400e;
            border-radius: 20px;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
            color: white;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            margin-top: 20px;
        }
        .footer {
            text-align: center;
            padding: 20px 30px;
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            margin: 0;
            color: #64748b;
            font-size: 12px;
        }
        .note {
            background-color: #fef3c7;
            border: 1px solid #fbbf24;
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
        }
        .note p {
            margin: 0;
            color: #92400e;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-wrapper">
            <div class="header">
                <h1>🎉 New Appointment Booking!</h1>
                <p>You have a new client consultation scheduled</p>
            </div>
            
            <div class="content">
                <p class="greeting">Hello Atty. {{ $appointment->lawyer->first_name }},</p>
                
                <div class="message">
                    <p>Great news! A new client has booked an appointment with you.</p>
                </div>

                <div class="client-box">
                    <h3>👤 Client Information</h3>
                    <div class="info-row">
                        <span class="label">Name:</span>
                        <span class="value">{{ $clientName }}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Email:</span>
                        <span class="value">{{ $clientEmail }}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Phone:</span>
                        <span class="value">{{ $clientPhone }}</span>
                    </div>
                </div>

                <div class="info-box">
                    <h3>📅 Appointment Details</h3>
                    <div class="info-row">
                        <span class="label">Date:</span>
                        <span class="value">{{ \Carbon\Carbon::parse($appointment->appointment_date)->format('l, F j, Y') }}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Time:</span>
                        <span class="value">{{ \Carbon\Carbon::parse($appointment->appointment_time)->format('g:i A') }}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Type:</span>
                        <span class="value">{{ ucfirst($appointment->meeting_type ?? 'In-Person') }}</span>
                    </div>
                    @if($appointment->client_notes)
                    <div class="info-row">
                        <span class="label">Client Notes:</span>
                        <span class="value">{{ $appointment->client_notes }}</span>
                    </div>
                    @endif
                </div>

                <div class="fee-box">
                    <h3>💰 Payment Information</h3>
                    <div class="info-row">
                        <span class="label">Consultation Fee:</span>
                        <span class="value">₱{{ number_format($appointment->consultation_fee ?? 0, 2) }}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Reservation Fee:</span>
                        <span class="value">₱{{ number_format($appointment->lawyer->reservation_fee ?? 100, 2) }}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Payment Status:</span>
                        <span class="status-badge">{{ ucfirst($appointment->payment_status ?? 'Pending') }}</span>
                    </div>
                </div>

                <div class="note">
                    <p><strong>📝 Note:</strong> The client will pay the reservation fee directly to your GCash or bank account and upload a payment receipt. You'll receive another email when they upload the payment proof for verification.</p>
                </div>

                <center>
                    <a href="{{ config('app.frontend_url') }}/lawyer/appointments" class="cta-button">
                        View Appointment Details
                    </a>
                </center>
            </div>

            <div class="footer">
                <p>This is an automated message from LegalKonect.</p>
                <p>© {{ date('Y') }} LegalKonect. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
