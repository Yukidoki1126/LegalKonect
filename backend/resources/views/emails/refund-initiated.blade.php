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
            background-color: #3b82f6;
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
        .processing-box {
            background-color: #dbeafe;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #3b82f6;
            border-radius: 4px;
        }
        .info-box {
            background-color: white;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #6b7280;
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
        .amount {
            font-size: 32px;
            font-weight: bold;
            color: #3b82f6;
            text-align: center;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
        }
        .timeline-box {
            background-color: #fef3c7;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }
        .status-processing {
            background-color: #dbeafe;
            color: #1d4ed8;
        }
        ul {
            padding-left: 20px;
        }
        li {
            margin: 8px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>⏳ Refund Request Submitted</h1>
    </div>

    <div class="content">
        <p>Hello {{ $appointment->user->name }},</p>

        <p>Your refund request has been <strong>submitted</strong> for the cancelled appointment with <strong>{{ $appointment->lawyer->first_name }} {{ $appointment->lawyer->last_name }}</strong>.</p>

        <div class="amount">
            ₱{{ number_format($appointment->refund_amount ?? $appointment->lawyer->reservation_fee ?? 100, 2) }}
        </div>

        <div class="processing-box">
            <h3 style="margin-top: 0; color: #1e40af;">Refund Details</h3>

            <div class="info-row">
                <span class="label">Original Appointment Date:</span>
                <span class="value">{{ \Carbon\Carbon::parse($appointment->appointment_date)->format('l, F j, Y') }}</span>
            </div>

            <div class="info-row">
                <span class="label">Cancellation Reason:</span>
                <span class="value">{{ $appointment->cancellation_reason ?? 'Not provided' }}</span>
            </div>

            <div class="info-row">
                <span class="label">Refund Status:</span>
                <span class="status-badge status-processing">⏳ Pending Admin Review</span>
            </div>
        </div>

        <div class="timeline-box">
            <strong style="color: #92400e;">📋 What happens next?</strong>
            <p style="margin: 10px 0 0 0; color: #78350f;">
                Since you cancelled less than 24 hours before your appointment, your refund request will be reviewed by our admin team.
            </p>
            <ul style="margin: 10px 0; color: #78350f;">
                <li><strong>Review Period:</strong> 3-5 business days</li>
                <li>You will receive an email once your refund is approved</li>
                <li>After approval, the refund will be processed to your original payment method</li>
            </ul>
        </div>

        <div class="info-box">
            <strong style="color: #374151;">Our Cancellation Policy:</strong>
            <ul style="margin: 10px 0; color: #4b5563;">
                <li><strong>24+ hours before appointment:</strong> Automatic refund</li>
                <li><strong>Less than 24 hours:</strong> Admin review required (3-5 business days)</li>
            </ul>
        </div>

        <div style="background-color: #e0e7ff; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #3730a3; font-size: 14px;">
                <strong>Need help?</strong> If you have any questions about your refund, please contact our support team.
            </p>
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
