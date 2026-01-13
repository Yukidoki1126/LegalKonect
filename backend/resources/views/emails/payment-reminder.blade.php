<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #2563eb; }
        .warning { background: #fef3c7; border-left-color: #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏰ Payment Reminder</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{{ $clientName }}</strong>,</p>
            
            <p>This is a friendly reminder that your appointment is scheduled in <strong>48 hours</strong> and the reservation fee has not been paid yet.</p>
            
            <div class="info-box">
                <h3>📅 Appointment Details:</h3>
                <p><strong>Lawyer:</strong> {{ $lawyerName }}</p>
                <p><strong>Date:</strong> {{ $appointmentDate }}</p>
                <p><strong>Time:</strong> {{ $appointmentTime }}</p>
                <p><strong>Reservation Fee:</strong> ₱{{ number_format($reservationFee, 2) }}</p>
            </div>

            <div class="warning">
                <strong>⚠️ Important:</strong> Your appointment will be automatically cancelled if payment is not received 24 hours before the scheduled time.
            </div>

            <p>Please complete your payment as soon as possible to secure your appointment.</p>

            <center>
                <a href="{{ env('FRONTEND_URL') }}/payment/{{ $appointmentId }}" class="button">
                    Pay Reservation Fee Now
                </a>
            </center>

            <p>If you have already paid, please disregard this message.</p>

            <p>Thank you,<br><strong>LegalKonect Team</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
