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
        .info-box {
            background-color: white;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #059669;
            border-radius: 4px;
        }
        .success-box {
            background-color: #d1fae5;
            padding: 20px;
            margin: 20px 0;
            border: 2px solid #059669;
            border-radius: 4px;
            text-align: center;
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
            background-color: #059669;
            color: white;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>✅ Appointment Reschedule Confirmed</h1>
    </div>

    <div class="content">
        <p>Hello {{ $appointment->user->name }},</p>

        <div class="success-box">
            <h2 style="margin: 0; color: #059669;">Your Appointment Has Been Rescheduled!</h2>
            <p style="margin: 10px 0 0 0; font-size: 14px;">Thank you for confirming the new date and time.</p>
        </div>

        <p>Your appointment with <strong>{{ $appointment->lawyer->first_name }} {{ $appointment->lawyer->last_name }}</strong> has been successfully rescheduled.</p>

        <div class="info-box">
            <h3 style="margin-top: 0; color: #059669;">Updated Appointment Details</h3>

            <div class="info-row">
                <span class="label">Lawyer:</span>
                <span class="value">{{ $appointment->lawyer->first_name }} {{ $appointment->lawyer->last_name }}</span>
            </div>

            <div class="info-row">
                <span class="label">Date:</span>
                <span class="value" style="font-size: 18px; font-weight: bold; color: #059669;">
                    {{ \Carbon\Carbon::parse($appointment->appointment_date)->format('l, F j, Y') }}
                </span>
            </div>

            <div class="info-row">
                <span class="label">Time:</span>
                <span class="value" style="font-size: 18px; font-weight: bold; color: #059669;">
                    {{ \Carbon\Carbon::parse($appointment->appointment_time)->format('g:i A') }}
                </span>
            </div>

            <div class="info-row">
                <span class="label">Duration:</span>
                <span class="value">{{ $appointment->duration }} minutes</span>
            </div>

            <div class="info-row">
                <span class="label">Meeting Link:</span>
                <span class="value">
                    @if($appointment->meeting_link)
                        <a href="{{ $appointment->meeting_link }}" style="color: #059669;">{{ $appointment->meeting_link }}</a>
                    @else
                        Will be provided before the meeting
                    @endif
                </span>
            </div>

            @if($appointment->payment_status === 'paid')
            <div class="info-row">
                <span class="label">Payment Status:</span>
                <span class="value" style="color: #059669; font-weight: bold;">✓ Paid</span>
            </div>
            @endif
        </div>

        <div style="background-color: #fef3c7; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <strong>⏰ Reminder:</strong>
            <p style="margin: 10px 0 0 0;">Please be available at the scheduled time. You'll receive a reminder 24 hours before your appointment.</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.frontend_url') }}/appointments" class="button">View My Appointments</a>
        </div>

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
