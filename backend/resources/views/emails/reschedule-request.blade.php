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
            background-color: #ea580c;
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
        .info-box {
            background-color: white;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #ea580c;
            border-radius: 4px;
        }
        .proposed-box {
            background-color: #fff7ed;
            padding: 20px;
            margin: 20px 0;
            border: 2px solid #fb923c;
            border-radius: 4px;
        }
        .info-row {
            margin: 10px 0;
        }
        .label {
            font-weight: bold;
            color: #4b5563;
        }
        .value {
            color: #1f2937;
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
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            text-align: center;
        }
        .button-accept {
            background-color: #059669;
            color: white;
        }
        .button-decline {
            background-color: #dc2626;
            color: white;
        }
        .reason-box {
            background-color: #fef3c7;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>⏰ Appointment Reschedule Request</h1>
    </div>

    <div class="content">
        <p>Hello {{ $appointment->user->name }},</p>

        <p>Your lawyer <strong>{{ $appointment->lawyer->first_name }} {{ $appointment->lawyer->last_name }}</strong> has requested to reschedule your appointment due to an emergency.</p>

        <div class="info-box">
            <h3 style="margin-top: 0; color: #ea580c;">Original Appointment</h3>

            <div class="info-row">
                <span class="label">Lawyer:</span>
                <span class="value">{{ $appointment->lawyer->first_name }} {{ $appointment->lawyer->last_name }}</span>
            </div>

            <div class="info-row">
                <span class="label">Current Date:</span>
                <span class="value">{{ \Carbon\Carbon::parse($appointment->appointment_date)->format('l, F j, Y') }}</span>
            </div>

            <div class="info-row">
                <span class="label">Current Time:</span>
                <span class="value">{{ $appointment->appointment_time }}</span>
            </div>
        </div>

        <div class="proposed-box">
            <h3 style="margin-top: 0; color: #c2410c;">Proposed New Date & Time</h3>

            <div class="info-row">
                <span class="label">New Date:</span>
                <span class="value" style="font-size: 18px; font-weight: bold; color: #c2410c;">
                    {{ \Carbon\Carbon::parse($appointment->proposed_date)->format('l, F j, Y') }}
                </span>
            </div>

            <div class="info-row">
                <span class="label">New Time:</span>
                <span class="value" style="font-size: 18px; font-weight: bold; color: #c2410c;">
                    {{ \Carbon\Carbon::parse($appointment->proposed_date)->format('h:i A') }}
                </span>
            </div>
        </div>

        @if($appointment->reschedule_reason)
        <div class="reason-box">
            <strong>Reason for Reschedule:</strong>
            <p style="margin: 10px 0 0 0;">{{ $appointment->reschedule_reason }}</p>
        </div>
        @endif

        <div style="background-color: #dbeafe; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <strong>Your Options:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li><strong>Accept:</strong> Your appointment will be moved to the new date & time</li>
                <li><strong>Decline:</strong> The appointment will be cancelled and you'll receive a full refund of ₱{{ number_format($appointment->lawyer->reservation_fee ?? 100, 2) }}</li>
            </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <p style="margin-bottom: 15px; font-weight: bold;">Please respond to this request:</p>
            <a href="{{ config('app.frontend_url') }}/appointments" class="button button-accept">Accept New Date</a>
            <a href="{{ config('app.frontend_url') }}/appointments" class="button button-decline">Decline & Get Refund</a>
        </div>

        <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
            Please log in to your LegalKonect account to respond to this reschedule request. You can find this notification in your appointments page.
        </p>

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
