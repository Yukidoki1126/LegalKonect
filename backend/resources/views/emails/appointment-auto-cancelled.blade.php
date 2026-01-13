<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #6b7280; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #6b7280; }
        .cancelled-box { background: #fee2e2; padding: 20px; margin: 20px 0; border-radius: 8px; border: 2px solid #dc2626; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>❌ Appointment Cancelled</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{{ $clientName }}</strong>,</p>
            
            <div class="cancelled-box">
                <h2 style="color: #dc2626; margin-top: 0;">Your Appointment Has Been Cancelled</h2>
                <p>Your appointment has been automatically cancelled because the reservation fee was not received within the required timeframe.</p>
            </div>
            
            <div class="info-box">
                <h3>📅 Cancelled Appointment:</h3>
                <p><strong>Lawyer:</strong> {{ $lawyerName }}</p>
                <p><strong>Date:</strong> {{ $appointmentDate }}</p>
                <p><strong>Time:</strong> {{ $appointmentTime }}</p>
                <p><strong>Unpaid Reservation Fee:</strong> ₱{{ number_format($reservationFee, 2) }}</p>
            </div>

            <p><strong>What this means:</strong></p>
            <ul>
                <li>Your appointment slot has been released</li>
                <li>No payment is required for this cancelled appointment</li>
                <li>You may book a new appointment at any time</li>
            </ul>

            <p>We're sorry your appointment couldn't proceed. If you'd like to reschedule, please book a new appointment and complete payment on time.</p>

            <center>
                <a href="{{ env('FRONTEND_URL') }}/lawyers" class="button">
                    Book a New Appointment
                </a>
            </center>

            <p>If you have any questions, please contact us.</p>

            <p>Thank you,<br><strong>LegalKonect Team</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
