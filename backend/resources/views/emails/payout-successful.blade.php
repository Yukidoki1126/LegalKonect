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
        .payout-box {
            background-color: white;
            padding: 25px;
            margin: 20px 0;
            border: 2px solid #10b981;
            border-radius: 8px;
        }
        .payout-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .payout-row:last-child {
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
        .info-box {
            background-color: #eff6ff;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #3b82f6;
            border-radius: 4px;
        }
        .breakdown-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>💰 Payout Successful!</h1>
    </div>

    <div class="content">
        <p>Hello {{ $payout->lawyer->first_name }} {{ $payout->lawyer->last_name }},</p>

        <p>Great news! Your payout has been successfully processed and the funds have been transferred to your account.</p>

        <div style="text-align: center;">
            <span class="success-badge">✓ PAYOUT COMPLETED</span>
        </div>

        <div class="payout-box">
            <h3 style="margin-top: 0; color: #10b981; text-align: center;">Payout Details</h3>

            <div class="payout-row">
                <span class="label">Payout Reference:</span>
                <span class="value">{{ $payout->transaction_reference }}</span>
            </div>

            <div class="payout-row">
                <span class="label">Processing Date:</span>
                <span class="value">{{ \Carbon\Carbon::parse($payout->approved_at)->format('F j, Y g:i A') }}</span>
            </div>

            <div class="payout-row">
                <span class="label">Payment Date:</span>
                <span class="value">{{ \Carbon\Carbon::parse($payout->paid_at)->format('F j, Y g:i A') }}</span>
            </div>

            <div class="payout-row">
                <span class="label">Payout Method:</span>
                <span class="value">{{ ucfirst($payout->payout_method) }}</span>
            </div>

            @if($payout->bank_name)
            <div class="payout-row">
                <span class="label">Bank:</span>
                <span class="value">{{ $payout->bank_name }}</span>
            </div>
            @endif

            <div class="payout-row">
                <span class="label">Account Details:</span>
                <span class="value">{{ $payout->payout_account_name }}<br>{{ $payout->payout_account_number }}</span>
            </div>

            <div class="total-row">
                <div class="payout-row" style="border: none;">
                    <span class="label" style="font-size: 18px;">Amount Transferred:</span>
                    <span class="total-amount">₱{{ number_format($payout->amount, 2) }}</span>
                </div>
            </div>
        </div>

        <div class="info-box">
            <h4 style="margin-top: 0; color: #1e40af;">📋 Payout Information</h4>

            <p style="margin: 10px 0; font-size: 14px; color: #4b5563;">
                This payout has been successfully processed and transferred to your registered account.
            </p>

            <div class="breakdown-row" style="border-top: 2px solid #3b82f6; padding-top: 12px; margin-top: 12px;">
                <span style="color: #1e40af; font-size: 16px;"><strong>Total Amount:</strong></span>
                <span style="color: #10b981; font-weight: bold; font-size: 18px;">₱{{ number_format($payout->amount, 2) }}</span>
            </div>

            <p style="margin: 15px 0 5px 0; font-size: 14px; color: #6b7280;">
                <strong>Requested Date:</strong><br>
                {{ \Carbon\Carbon::parse($payout->requested_at)->format('F j, Y g:i A') }}
            </p>
        </div>

        @if($payout->admin_notes)
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e;">
                <strong>📝 Admin Notes:</strong><br>
                {{ $payout->admin_notes }}
            </p>
        </div>
        @endif

        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #374151; font-size: 14px;">
                <strong>💡 Note:</strong> The funds should appear in your account within 1-3 business days, depending on your bank's processing time.
            </p>
        </div>

        <p><strong>Need help?</strong><br>
        If you have any questions about this payout, please contact our support team.</p>

        <p style="margin-top: 30px;">
            Thank you for being a valued member of LegalKonect!<br>
            <strong>The LegalKonect Team</strong>
        </p>
    </div>

    <div class="footer">
        <p>This is an official payout confirmation. Keep this email for your records.</p>
        <p>&copy; {{ date('Y') }} LegalKonect. All rights reserved.</p>
    </div>
</body>
</html>
