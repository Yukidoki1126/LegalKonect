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
            background-color: #10b981;
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
            border-left: 4px solid #10b981;
            border-radius: 4px;
        }
        .info-box {
            background-color: white;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #3b82f6;
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
            color: #10b981;
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
        <h1>✅ Refund Processed Successfully</h1>
    </div>

    <div class="content">
        <p>Hello {{ $appointment->user->name }},</p>

        <p>Your refund has been successfully processed for the cancelled appointment with <strong>{{ $appointment->lawyer->first_name }} {{ $appointment->lawyer->last_name }}</strong>.</p>

        <div class="amount">
            ₱{{ number_format($appointment->refund_amount, 2) }}
        </div>

        <div class="success-box">
            <h3 style="margin-top: 0; color: #065f46;">Refund Details</h3>

            <div class="info-row">
                <span class="label">Refund ID:</span>
                <span class="value">{{ $appointment->refund_id }}</span>
            </div>

            <div class="info-row">
                <span class="label">Original Appointment Date:</span>
                <span class="value">{{ \Carbon\Carbon::parse($appointment->appointment_date)->format('l, F j, Y') }}</span>
            </div>

            <div class="info-row">
                <span class="label">Payment Method:</span>
                <span class="value">
                    @php
                        $paymentDetails = json_decode($appointment->payment_details ?? '{}', true);
                    @endphp
                    @if(!empty($paymentDetails) && $paymentDetails['type'] === 'card')
                        {{ ucfirst($paymentDetails['brand'] ?? 'Card') }} ending in {{ $paymentDetails['last4'] ?? '****' }}
                    @elseif(!empty($paymentDetails) && $paymentDetails['type'] === 'gcash')
                        GCash
                    @elseif(!empty($paymentDetails) && $paymentDetails['type'] === 'paymaya')
                        PayMaya
                    @elseif(!empty($paymentDetails) && $paymentDetails['type'] === 'grab_pay')
                        GrabPay
                    @else
                        {{ ucfirst($appointment->payment_method) }}
                    @endif
                </span>
            </div>

            <div class="info-row">
                <span class="label">Refund Status:</span>
                <span class="value" style="color: #10b981; font-weight: bold;">✓ Completed</span>
            </div>
        </div>

        <div class="timeline-box">
            <strong style="color: #92400e;">When will I receive my refund?</strong>
            <p style="margin: 10px 0 0 0; color: #78350f;">
                @php
                    $paymentDetails = json_decode($appointment->payment_details ?? '{}', true);
                    $paymentType = $paymentDetails['type'] ?? $appointment->payment_method;
                @endphp
                @if($paymentType === 'card')
                    Your refund will be credited to your
                    @if(!empty($paymentDetails['brand']) && !empty($paymentDetails['last4']))
                        <strong>{{ ucfirst($paymentDetails['brand']) }} card ending in {{ $paymentDetails['last4'] }}</strong>
                    @else
                        <strong>card</strong>
                    @endif
                    within <strong>5-10 business days</strong>.
                @elseif($paymentType === 'gcash')
                    Your refund will be credited to your <strong>GCash account</strong> within <strong>1-3 business days</strong>.
                @elseif($paymentType === 'paymaya')
                    Your refund will be credited to your <strong>PayMaya account</strong> within <strong>1-3 business days</strong>.
                @elseif($paymentType === 'grab_pay')
                    Your refund will be credited to your <strong>GrabPay account</strong> within <strong>1-3 business days</strong>.
                @else
                    Your refund will be processed within <strong>3-5 business days</strong>.
                @endif
            </p>
        </div>

        <div class="info-box">
            <strong style="color: #1e40af;">Important Information:</strong>
            <ul style="margin: 10px 0; color: #1e3a8a;">
                <li>The refund has been initiated by PayMongo</li>
                <li>You will see the credit in your original payment method</li>
                <li>Processing time depends on your bank/payment provider</li>
                <li>You may book a new appointment anytime</li>
                @if($appointment->refund_reason)
                <li><strong>Reason:</strong> {{ $appointment->refund_reason }}</li>
                @endif
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
