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
            background-color: #2563eb;
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
            border-left: 4px solid #2563eb;
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
        .status {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
        }
        .status-pending {
            background-color: #fef3c7;
            color: #92400e;
        }
        .status-paid {
            background-color: #d1fae5;
            color: #065f46;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 Appointment Confirmed!</h1>
    </div>
    
    <div class="content">
        <p>Hello {{ $appointment->user->name }},</p>
        
        <p>Your appointment has been successfully booked with <strong>{{ $appointment->lawyer->first_name }} {{ $appointment->lawyer->last_name }}</strong>.</p>
        
        <div class="info-box">
            <h3 style="margin-top: 0; color: #2563eb;">Appointment Details</h3>
            
            <div class="info-row">
                <span class="label">Lawyer:</span>
               <span class="value">{{ $appointment->lawyer->first_name }} {{ $appointment->lawyer->last_name }}</span>
            </div>
            
          
            
            <div class="info-row">
                <span class="label">Date:</span>
                <span class="value">{{ \Carbon\Carbon::parse($appointment->appointment_date)->format('l, F j, Y') }}</span>
            </div>
            
            <div class="info-row">
                <span class="label">Time:</span>
                <span class="value">{{ $appointment->appointment_time }}</span>
            </div>
            
            <div class="info-row">
                <span class="label">Location:</span>
              <span class="value">{{ $appointment->lawyer->office_address }}</span>
            </div>
            
            <div class="info-row">
                <span class="label">Total Consultation Fee:</span>
                <span class="value">₱{{ number_format($appointment->consultation_fee ?? 0, 2) }}</span>
            </div>

            <div class="info-row">
                <span class="label">Reservation Fee Paid:</span>
                <span class="value" style="color: #059669; font-weight: bold;">₱{{ number_format($appointment->lawyer->reservation_fee ?? 100, 2) }}</span>
            </div>

            <div class="info-row">
                <span class="label">Balance Due at Office:</span>
                <span class="value" style="color: #dc2626; font-weight: bold;">₱{{ number_format($appointment->consultation_fee - ($appointment->lawyer->reservation_fee ?? 100), 2) }}</span>
            </div>

            <div class="info-row">
                <span class="label">Payment Status:</span>
                @if($appointment->payment_status === 'paid')
                    <span class="status status-paid">PAID</span>
                @else
                    <span class="status status-pending">PENDING PAYMENT</span>
                @endif
            </div>
            
            @if($appointment->notes)
            <div class="info-row" style="margin-top: 20px;">
                <span class="label">Your Notes:</span>
                <p class="value" style="margin: 5px 0;">{{ $appointment->notes }}</p>
            </div>
            @endif
        </div>
        
        @if($appointment->payment_status !== 'paid')
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <strong>⚠️ Reservation Fee Payment Required</strong>
            <p style="margin: 10px 0 0 0;">Please complete your reservation fee payment of ₱{{ number_format($appointment->lawyer->reservation_fee ?? 100, 2) }} to confirm your appointment. You can pay through your LegalKonect dashboard.</p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #92400e;">The remaining balance of ₱{{ number_format($appointment->consultation_fee - ($appointment->lawyer->reservation_fee ?? 100), 2) }} will be paid at the law office.</p>
        </div>
        @endif

        <p>If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
        
        <p>We look forward to serving you!</p>
        
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