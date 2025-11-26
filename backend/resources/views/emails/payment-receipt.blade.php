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
        .receipt-box {
            background-color: white;
            padding: 25px;
            margin: 20px 0;
            border: 2px solid #10b981;
            border-radius: 8px;
        }
        .receipt-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .receipt-row:last-child {
            border-bottom: none;
        }
        .label {
            font-weight: bold;
            color: #4b5563;
        }
        .value {
            color: #1f2937;
            text-align: right;
        }
        .total-row {
            background-color: #f3f4f6;
            padding: 15px;
            margin-top: 10px;
            border-radius: 4px;
        }
        .total-amount {
            font-size: 24px;
            font-weight: bold;
            color: #10b981;
        }
        .success-badge {
            background-color: #d1fae5;
            color: #065f46;
            padding: 8px 20px;
            border-radius: 20px;
            font-weight: bold;
            display: inline-block;
            margin: 10px 0;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
        }
        .appointment-details {
            background-color: #eff6ff;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #3b82f6;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>💳 Payment Received!</h1>
    </div>
    
    <div class="content">
        <p>Hello {{ $appointment->user->name }},</p>
        
        <p>Thank you for your payment! Your transaction has been processed successfully.</p>
        
        <div style="text-align: center;">
            <span class="success-badge">✓ PAYMENT CONFIRMED</span>
        </div>

        <div class="receipt-box">
            <h3 style="margin-top: 0; color: #10b981; text-align: center;">Payment Receipt</h3>
            
            <div class="receipt-row">
                <span class="label">Transaction ID:</span>
                <span class="value">{{ $appointment->payment_reference }}</span>
            </div>
            
            <div class="receipt-row">
                <span class="label">Payment Date:</span>
                <span class="value">{{ \Carbon\Carbon::parse($appointment->updated_at)->format('F j, Y g:i A') }}</span>
            </div>
            
            <div class="receipt-row">
                <span class="label">Payment Method:</span>
                <span class="value">{{ ucfirst($appointment->payment_method ?? 'Card') }}</span>
            </div>
            
            <div class="receipt-row">
                <span class="label">Service:</span>
                <span class="value">Legal Consultation</span>
            </div>
            
            <div class="receipt-row">
                <span class="label">Lawyer:</span>
                <span class="value">{{ $appointment->lawyer->first_name }} {{ $appointment->lawyer->last_name }}</span>
            </div>
            
            <div class="total-row">
                <div class="receipt-row" style="border: none;">
                    <span class="label" style="font-size: 18px;">Amount Paid:</span>
                    <span class="total-amount">₱{{ number_format($appointment->lawyer->reservation_fee ?? 100, 2) }}</span>
                </div>
            </div>

            @if($appointment->consultation_fee > ($appointment->lawyer->reservation_fee ?? 100))
            <div style="background-color: #eff6ff; padding: 12px; margin-top: 10px; border-radius: 4px; border-left: 3px solid #3b82f6;">
                <div class="receipt-row" style="border: none; padding: 4px 0;">
                    <span class="label" style="color: #1e40af; font-size: 14px;">Total Consultation Fee:</span>
                    <span style="color: #1e40af; font-weight: bold;">₱{{ number_format($appointment->consultation_fee, 2) }}</span>
                </div>
                <div class="receipt-row" style="border: none; padding: 4px 0;">
                    <span class="label" style="color: #1e40af; font-size: 14px;">Reservation Fee Paid:</span>
                    <span style="color: #059669; font-weight: bold;">-₱{{ number_format($appointment->lawyer->reservation_fee ?? 100, 2) }}</span>
                </div>
                <div class="receipt-row" style="border: none; padding: 8px 0; border-top: 2px solid #3b82f6;">
                    <span class="label" style="color: #1e40af; font-size: 15px;">Balance Due at Office:</span>
                    <span style="color: #dc2626; font-weight: bold; font-size: 16px;">₱{{ number_format($appointment->consultation_fee - ($appointment->lawyer->reservation_fee ?? 100), 2) }}</span>
                </div>
            </div>
            @endif
        </div>

        <div class="appointment-details">
            <h4 style="margin-top: 0; color: #1e40af;">📅 Your Appointment Details</h4>
            
            <p style="margin: 8px 0;">
                <strong>Date:</strong> {{ \Carbon\Carbon::parse($appointment->appointment_date)->format('l, F j, Y') }}
            </p>
            
            <p style="margin: 8px 0;">
                <strong>Time:</strong> {{ \Carbon\Carbon::parse($appointment->appointment_time)->format('g:i A') }}
            </p>
            
            <p style="margin: 8px 0;">
                <strong>Location:</strong> {{ $appointment->lawyer->office_address }}
            </p>
            
            <p style="margin: 8px 0;">
                <strong>Type:</strong> {{ ucfirst($appointment->meeting_type) }}
            </p>
        </div>

        <div style="background-color: #fef3c7; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;">
                <strong>📌 Important Reminder:</strong><br>
                Please arrive 10 minutes early for your appointment.
            </p>
        </div>

        <p><strong>Need to reschedule?</strong><br>
        Please contact us at least 24 hours in advance.</p>

        <p style="margin-top: 30px;">
            Thank you for choosing LegalKonect!<br>
            <strong>The LegalKonect Team</strong>
        </p>
    </div>
    
    <div class="footer">
        <p>This is an official payment receipt. Keep this email for your records.</p>
        <p>&copy; {{ date('Y') }} LegalKonect. All rights reserved.</p>
    </div>
</body>
</html>