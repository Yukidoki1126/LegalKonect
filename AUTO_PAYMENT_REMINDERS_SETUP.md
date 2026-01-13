# Automatic Payment Reminders & Cancellation Setup

## What It Does

This system automatically:
1. **48 hours before appointment**: Sends payment reminder email
2. **24 hours before appointment**: Sends final warning email  
3. **At 24 hours before**: Auto-cancels unpaid appointments + sends cancellation email

## How It Works

The Laravel scheduler runs `appointments:process-unpaid` command **every hour** to check for:
- Unpaid appointments (`payment_status !== 'paid'`)
- Scheduled time approaching
- Sends appropriate emails based on timing

## Setup on Render

### Step 1: Add Laravel Scheduler to Render

Render doesn't automatically run Laravel's scheduler. You need to add a cron job.

**Option A: Use Render Cron Jobs (Recommended)**

1. Go to your Render dashboard
2. Click **"New" → "Cron Job"**
3. Configure:
   - **Name**: `legalkonect-scheduler`
   - **Environment**: Same as your web service
   - **Command**: `php artisan schedule:run`
   - **Schedule**: `* * * * *` (every minute - Laravel handles the actual scheduling)
   - **Connect your repo** and select the same branch

**Option B: Add to existing service (if using worker)**

In your `Procfile`, add:
```
web: php artisan serve --host=0.0.0.0 --port=$PORT
scheduler: while true; do php artisan schedule:run; sleep 60; done
```

Then in Render, enable the worker process.

### Step 2: Verify Environment Variables

Make sure these are set in Render:
- `MAIL_MAILER=resend`
- `RESEND_KEY=your_resend_api_key`
- `MAIL_FROM_ADDRESS=noreply@legalkonect.site`
- `MAIL_FROM_NAME=LegalKonect`
- `FRONTEND_URL=https://www.legalkonect.site`

### Step 3: Test Locally (Optional)

Run manually to test:
```bash
php artisan appointments:process-unpaid
```

Or test the full scheduler:
```bash
php artisan schedule:run
```

## Email Templates

The system sends 3 types of emails:

1. **Payment Reminder** (48h before)
   - Template: `resources/views/emails/payment-reminder.blade.php`
   - Subject: "Payment Reminder - Your Appointment is in 48 Hours"

2. **Final Warning** (24h before)
   - Template: `resources/views/emails/payment-final-warning.blade.php`
   - Subject: "⚠️ Final Warning - Payment Required in 24 Hours"

3. **Auto-Cancelled** (at 24h before if unpaid)
   - Template: `resources/views/emails/appointment-auto-cancelled.blade.php`
   - Subject: "Appointment Cancelled - Payment Not Received"

## Monitoring

View logs in Render:
- Go to your cron job → **Logs** tab
- Check `storage/logs/unpaid-appointments.log`

## Customization

### Change timing:
Edit `app/Console/Commands/ProcessUnpaidAppointments.php`:
```php
$in48Hours = $now->copy()->addHours(48); // Change to 72 for 3 days
$in24Hours = $now->copy()->addHours(24); // Change to 12 for 12 hours
```

### Change scheduler frequency:
Edit `app/Console/Kernel.php`:
```php
$schedule->command('appointments:process-unpaid')
         ->everyThirtyMinutes() // or ->hourly() or ->daily()
```

## Troubleshooting

**Emails not sending?**
- Check Resend API key is correct in Render
- Check Render logs for errors
- Verify `MAIL_FROM_ADDRESS` domain is verified in Resend

**Scheduler not running?**
- Verify cron job is active in Render
- Check cron job logs
- Make sure `* * * * *` schedule is set correctly

**Testing without waiting 24 hours?**
Temporarily change the timing in the command:
```php
$in24Hours = $now->copy()->addMinutes(5); // Test with 5 minutes
```

## Production Checklist

- [ ] Cron job created in Render
- [ ] Environment variables set
- [ ] Test with a fake appointment
- [ ] Email templates look good
- [ ] Logs are accessible
- [ ] Resend domain verified
