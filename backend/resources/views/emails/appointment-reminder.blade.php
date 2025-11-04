<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appointment Reminder - LegalKonect</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f7fc;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .reminder-badge {
            display: inline-block;
            background-color: #ffc107;
            color: #333;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            margin-top: 10px;
        }
        .content {
            padding: 30px;
        }
        .greeting {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
        }
        .appointment-box {
            background-color: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .appointment-detail {
            margin: 15px 0;
            display: flex;
            align-items: flex-start;
        }
        .appointment-label {
            font-weight: bold;
            color: #555;
            width: 120px;
            flex-shrink: 0;
        }
        .appointment-value {
            color: #333;
            flex: 1;
        }
        .important-notice {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
        }
        .important-notice h3 {
            color: #856404;
            margin: 0 0 10px 0;
            font-size: 16px;
        }
        .checklist {
            background-color: #e8f4fd;
            border-radius: 4px;
            padding: 20px;
            margin: 20px 0;
        }
        .checklist h3 {
            color: #1a73e8;
            margin: 0 0 15px 0;
            font-size: 18px;
        }
        .checklist ul {
            margin: 0;
            padding-left: 20px;
        }
        .checklist li {
            margin: 8px 0;
            color: #333;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        .footer a {
            color: #667eea;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚖️ LegalKonect</h1>
            <div class="reminder-badge">⏰ APPOINTMENT REMINDER</div>
        </div>
        
        <div class="content">
            <div class="greeting">
                Dear {{ $appointment->user->name }},
            </div>
            
            <p>This is a friendly reminder that you have an appointment scheduled for <strong>tomorrow</strong>.</p>
            
            <div class="appointment-box">
                <div class="appointment-detail">
                    <span class="appointment-label">📅 Date:</span>
                    <span class="appointment-value">{{ $formattedDate }} (Tomorrow)</span>
                </div>
                <div class="appointment-detail">
                    <span class="appointment-label">⏰ Time:</span>
                    <span class="appointment-value">{{ $formattedTime }}</span>
                </div>
                <div class="appointment-detail">
                    <span class="appointment-label">👨‍⚖️ Lawyer:</span>
                    <span class="appointment-value">{{ $lawyerName }}</span>
                </div>
                <div class="appointment-detail">
                    <span class="appointment-label">📋 Type:</span>
                    <span class="appointment-value">{{ ucfirst($appointment->consultation_type) }} Consultation</span>
                </div>
                @if($appointment->notes)
                <div class="appointment-detail">
                    <span class="appointment-label">📝 Your Notes:</span>
                    <span class="appointment-value">{{ $appointment->notes }}</span>
                </div>
                @endif
            </div>
            
            <div class="important-notice">
                <h3>⚠️ Important Reminders</h3>
                <ul style="margin: 0; padding-left: 20px;">
                    <li>Please arrive 10 minutes early for your appointment</li>
                    <li>If you need to cancel or reschedule, please contact us as soon as possible</li>
                    <li>Your appointment is already paid and confirmed</li>
                </ul>
            </div>
            
            <div class="checklist">
                <h3>📋 What to Bring</h3>
                <ul>
                    <li>Valid government-issued ID</li>
                    <li>Any relevant documents related to your case</li>
                    <li>List of questions you want to discuss</li>
                    <li>Previous legal documents (if applicable)</li>
                    <li>Notebook and pen for taking notes</li>
                </ul>
            </div>
            
            <div class="button-container">
                <a href="{{ env('FRONTEND_URL') }}/appointments" class="button">View Appointment Details</a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
                If you have any questions or need to make changes to your appointment, please don't hesitate to contact us.
            </p>
        </div>
        
        <div class="footer">
            <p>© 2025 LegalKonect. All rights reserved.</p>
            <p>
                This is an automated reminder. Please do not reply to this email.<br>
                For assistance, visit <a href="{{ env('FRONTEND_URL') }}">our website</a>
            </p>
        </div>
    </div>
</body>
</html>