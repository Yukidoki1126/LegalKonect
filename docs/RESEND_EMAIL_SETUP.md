# Resend Email Setup Guide for LegalKonect

**Date**: 2025-11-22
**Status**: ✅ Configured and Ready
**Service**: Resend (resend.com)

---

## 📋 Overview

LegalKonect uses **Resend** as the email delivery service for sending:
- Appointment confirmation emails
- Payment receipts
- Appointment reminders
- Lawyer verification notifications (when implemented)
- Payout status notifications (when implemented)

**Why Resend?**
- ✅ Free tier: 3,000 emails/month (100/day)
- ✅ Excellent deliverability
- ✅ Simple setup (5 minutes)
- ✅ Developer-friendly API
- ✅ Modern dashboard and analytics

---

## 🚀 Quick Setup (Production)

### Step 1: Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up with your email
3. Verify your email address

### Step 2: Get Your API Key

1. Login to [Resend Dashboard](https://resend.com/dashboard)
2. Click **"API Keys"** in the sidebar
3. Click **"Create API Key"**
4. Name it: `LegalKonect Production`
5. Copy the API key (starts with `re_...`)

**Important**: Save this key securely - you won't see it again!

### Step 3: Verify Your Domain (Recommended)

For production, you should verify your domain to send from `@legalkonect.com`:

1. Go to **Domains** in Resend Dashboard
2. Click **"Add Domain"**
3. Enter your domain: `legalkonect.com`
4. Add the DNS records provided by Resend to your domain:
   - **SPF** record
   - **DKIM** records
   - **DMARC** record (optional but recommended)
5. Wait for verification (usually 5-15 minutes)

**DNS Records Example:**
```
Type: TXT
Name: @ (or legalkonect.com)
Value: v=spf1 include:resend.com ~all

Type: TXT
Name: resend._domainkey
Value: [provided by Resend]

Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@legalkonect.com
```

### Step 4: Update Backend .env

Edit `backend/.env`:

```env
# Email Configuration - Resend
MAIL_MAILER=resend
RESEND_KEY=re_your_actual_api_key_here
MAIL_FROM_ADDRESS="noreply@legalkonect.com"
MAIL_FROM_NAME="LegalKonect"
```

**Replace** `re_your_actual_api_key_here` with your actual Resend API key.

### Step 5: Clear Config Cache

```bash
cd backend
php artisan config:clear
php artisan cache:clear
```

### Step 6: Test Email Sending

You can test by creating a test appointment or using tinker:

```bash
php artisan tinker
```

Then in tinker:
```php
use App\Models\Appointment;
use App\Mail\AppointmentBooked;
use Illuminate\Support\Facades\Mail;

// Get any appointment (or create a test one)
$appointment = Appointment::with(['user', 'lawyer'])->first();

// Send test email
Mail::to('your-test-email@example.com')->send(new AppointmentBooked($appointment));

// Check for errors
echo "Email sent successfully!";
exit
```

---

## 🧪 Testing Setup (Development)

For development/testing, you have two options:

### Option A: Use Resend Test Mode (Recommended)

Same as production, but create a separate API key for testing:
1. Create API key named `LegalKonect Development`
2. Use in your local `.env`

**Benefits:**
- See emails in Resend dashboard
- Test deliverability
- Monitor email analytics

### Option B: Use Log Driver (No Real Emails)

Edit `backend/.env`:
```env
MAIL_MAILER=log
```

Emails will be written to `backend/storage/logs/laravel.log` instead of being sent.

**Benefits:**
- No API key needed
- Won't accidentally email real users
- Good for quick local testing

---

## 📧 Email Types Currently Configured

### 1. Appointment Booked Email
**Mailable**: `App\Mail\AppointmentBooked`
**Template**: `backend/resources/views/emails/appointment-booked.blade.php`
**Sent When**:
- Appointment is created
- Payment is completed

**Data Included:**
- Lawyer details
- Appointment date/time
- Location
- Consultation fee
- Payment status
- User notes

### 2. Payment Receipt
**Mailable**: `App\Mail\PaymentReceipt`
**Template**: `backend/resources/views/emails/payment-receipt.blade.php`
**Sent When**: Payment is successfully processed

### 3. Appointment Reminder
**Mailable**: `App\Mail\AppointmentReminder`
**Template**: `backend/resources/views/emails/appointment-reminder.blade.php`
**Sent When**: 24 hours before appointment (via scheduled command)

**To enable automated reminders:**
```bash
# Add to crontab (Linux/Mac)
* * * * * cd /path/to/legalkonect/backend && php artisan schedule:run >> /dev/null 2>&1

# Or run manually for testing
php artisan appointments:send-reminders
```

---

## 🔧 Configuration Files

### Modified Files

1. **backend/.env.example**
   ```env
   MAIL_MAILER=resend
   RESEND_KEY=
   MAIL_FROM_ADDRESS="noreply@legalkonect.com"
   MAIL_FROM_NAME="LegalKonect"
   ```

2. **backend/config/mail.php**
   - Default mailer changed to `resend`
   - Resend mailer configuration added with API key

3. **composer.json**
   - Added `resend/resend-laravel` package

---

## 📊 Monitoring and Analytics

### Resend Dashboard

Access: [resend.com/dashboard](https://resend.com/dashboard)

**What you can see:**
- ✅ Emails sent count
- ✅ Delivery status
- ✅ Bounce rate
- ✅ Open rate (if tracking enabled)
- ✅ Click rate (if tracking enabled)
- ✅ Email logs and details

### Laravel Logs

Check `backend/storage/logs/laravel.log` for:
- Email sending errors
- API connection issues
- Mail queue status

---

## 💰 Pricing and Limits

### Free Tier
- **3,000 emails/month**
- **100 emails/day**
- Perfect for starting out

**Estimation for LegalKonect:**
- Each appointment = ~3 emails (booking, reminder, receipt)
- 3,000 emails = ~1,000 appointments/month
- That's ~33 appointments/day average

### Paid Plans (when you grow)

**Starter**: $20/month
- 50,000 emails/month
- ~16,666 appointments/month

**Pro**: $80/month
- 200,000 emails/month
- Dedicated IP
- Priority support

---

## 🔒 Security Best Practices

### API Key Security

1. **Never commit API keys to Git**
   - API keys are in `.env` (which is in `.gitignore`)
   - `.env.example` has empty placeholder

2. **Use different keys for environments**
   - Development: `LegalKonect Development`
   - Production: `LegalKonect Production`
   - Can revoke keys independently

3. **Rotate keys periodically**
   - Create new key
   - Update `.env`
   - Delete old key from Resend

### Domain Security

1. **Use SPF, DKIM, DMARC**
   - Prevents email spoofing
   - Improves deliverability
   - Required for production

2. **Monitor bounce rates**
   - High bounce rate = delivery issues
   - Check Resend dashboard weekly

---

## 🐛 Troubleshooting

### Issue 1: "Invalid API key" Error

**Cause**: API key not set or incorrect

**Fix:**
```bash
# Check .env has correct key
cat backend/.env | grep RESEND_KEY

# Clear config cache
php artisan config:clear
```

### Issue 2: Emails Not Sending

**Debug steps:**
```bash
# Check mail config
php artisan tinker
>>> config('mail.default')
=> "resend"
>>> config('mail.mailers.resend.key')
=> "re_xxxxx..."  # Should show your key

# Check logs
tail -f backend/storage/logs/laravel.log
```

### Issue 3: Emails Going to Spam

**Solutions:**
1. Verify your domain in Resend
2. Add proper SPF/DKIM records
3. Warm up your domain (start slow, increase volume gradually)
4. Avoid spam trigger words in subject/body
5. Include unsubscribe link (for marketing emails)

### Issue 4: "Domain not verified" Error

**Fix:**
1. Check DNS records are properly added
2. Wait 15-30 minutes for DNS propagation
3. Use [MXToolbox](https://mxtoolbox.com) to verify DNS records
4. Contact Resend support if still failing

---

## 📝 Testing Checklist

Before going to production, test:

- [ ] Appointment booking email (new appointment)
- [ ] Appointment booking email (payment pending)
- [ ] Payment receipt email
- [ ] Appointment reminder email (24h before)
- [ ] Check all emails render correctly on:
  - [ ] Gmail
  - [ ] Outlook
  - [ ] Apple Mail
  - [ ] Mobile devices
- [ ] Verify links work in emails
- [ ] Check sender name shows "LegalKonect"
- [ ] Verify "from" address is correct
- [ ] Monitor Resend dashboard for delivery status

---

## 🔄 Migration from Log Driver

If you were using `MAIL_MAILER=log` before:

1. **No data migration needed** - it's just configuration
2. Update `.env` as shown above
3. Clear cache
4. Test one email
5. Monitor Resend dashboard

**Rollback (if needed):**
```env
MAIL_MAILER=log
```

---

## 📞 Support

### Resend Support
- **Documentation**: [resend.com/docs](https://resend.com/docs)
- **Email**: support@resend.com
- **Discord**: [Resend Community](https://resend.com/discord)

### Laravel Mail Documentation
- **Docs**: [laravel.com/docs/mail](https://laravel.com/docs/10.x/mail)
- **Mailables**: [laravel.com/docs/10.x/mail#generating-mailables](https://laravel.com/docs/10.x/mail#generating-mailables)

---

## 🎯 Next Steps

### Immediate
1. ✅ Install Resend package (Done)
2. ✅ Update configuration (Done)
3. 🔲 Get Resend API key
4. 🔲 Update `.env` with API key
5. 🔲 Test email sending

### Future Enhancements
1. Add lawyer verification emails ([AdminVerificationController.php](../backend/app/Http/Controllers/AdminVerificationController.php:129))
2. Add payout notification emails
3. Add email templates for:
   - Welcome email for new users
   - Password reset
   - Email verification
4. Enable email tracking (opens/clicks)
5. Set up custom email domain

---

**Status**: ✅ Package installed and configured. Ready to use once API key is added!

**Last Updated**: 2025-11-22
