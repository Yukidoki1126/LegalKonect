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
        .warning-box {
            background-color: #fef3c7;
            padding: 20px;
            margin: 20px 0;
            border: 2px solid #f59e0b;
            border-radius: 4px;
        }
        .info-box {
            background-color: white;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #ea580c;
            border-radius: 4px;
        }
        .reason-box {
            background-color: #fee2e2;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #dc2626;
            border-radius: 4px;
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
            background-color: #ea580c;
            color: white;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            text-align: center;
        }
        ul {
            margin: 15px 0;
            padding-left: 20px;
        }
        li {
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Verification Status Update</h1>
    </div>

    <div class="content">
        <p>Dear {{ $lawyer->first_name }} {{ $lawyer->last_name }},</p>

        <p>Thank you for your interest in joining LegalKonect as a verified lawyer. After reviewing your application and submitted documents, we regret to inform you that we are unable to approve your lawyer account at this time.</p>

        <div class="reason-box">
            <h3 style="margin-top: 0; color: #dc2626;">Reason for Rejection:</h3>
            <p style="margin: 10px 0 0 0; white-space: pre-wrap;">{{ $reason }}</p>
        </div>

        <div class="info-box">
            <h3 style="margin-top: 0; color: #ea580c;">What Can You Do?</h3>
            <ul>
                <li><strong>Review the Feedback:</strong> Carefully read the rejection reason above</li>
                <li><strong>Update Your Documents:</strong> Address the issues mentioned in the feedback</li>
                <li><strong>Resubmit Your Application:</strong> Once you've made the necessary corrections, you can resubmit your profile for review</li>
                <li><strong>Contact Support:</strong> If you have questions about the decision, reach out to our support team</li>
            </ul>
        </div>

        <div class="warning-box">
            <strong>📋 Common Reasons for Rejection:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Incomplete or unclear documentation</li>
                <li>Invalid or expired professional licenses</li>
                <li>Documents that don't match registration information</li>
                <li>Poor quality scans or photos of credentials</li>
                <li>Missing required certifications or bar membership</li>
            </ul>
        </div>

        <div style="background-color: #dbeafe; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <strong>💡 Tips for Resubmission:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Ensure all documents are clear, legible, and up-to-date</li>
                <li>Verify that your bar number and certifications are valid</li>
                <li>Upload high-quality scans or photos of your credentials</li>
                <li>Double-check that all information matches official records</li>
                <li>Include any additional supporting documents requested</li>
            </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.frontend_url') }}/lawyer/profile" class="button">Update Your Profile</a>
        </div>

        <p>We appreciate your understanding and look forward to reviewing your updated application. If you need clarification on any of the feedback provided, please contact our support team at support@legalkonect.com.</p>

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
