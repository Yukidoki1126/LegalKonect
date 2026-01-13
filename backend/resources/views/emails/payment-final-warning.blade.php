<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #dc2626; }
        .urgent { background: #fee2e2; border: 2px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 FINAL WARNING</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{{ $clientName }}</strong>,</p>
            
            <div class="urgent">
                <h2 style="color: #dc2626; margin-top: 0;">⚠️ URGENT: Pay Within 24 Hours</h2>
                <p style="font-size: 16px;">Your appointment will be <strong>automatically cancelled</strong> in 24 hours if payment is not received.</p>
            </div>
            
            <div class="info-box">
                <h3>📅 Appointment Details:</h3>
                <p><strong>Lawyer:</strong> {{ $lawyerName }}</p>
                <p><strong>Date:</strong> {{ $appointmentDate }}</p>
                <p><strong>Time:</strong> {{ $appointmentTime }}</p>
                <p><strong>Reservation Fee:</strong> ₱{{ number_format($reservationFee, 2) }}</p>
            </div>

            <p><strong>This is your last chance to secure this appointment.</strong> Please complete payment immediately to avoid automatic cancellation.</p>

            <center>
                <a href="{{ env('FRONTEND_URL') }}/payment/{{ $appointmentId }}" class="button">
                    PAY NOW TO SAVE APPOINTMENT
                </a>
            </center>

            <p>If payment is not received within 24 hours, you will need to rebook your appointment.</p>

            <p>Thank you,<br><strong>LegalKonect Team</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated final warning. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
