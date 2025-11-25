# LegalKonect - Testing Guide

**Date**: 2025-11-22
**Branch**: `expiremental`
**Status**: Ready for Testing

---

## 📋 Pre-Testing Checklist

Before you start testing, ensure:

- [x] Backend Laravel installed and configured
- [x] Frontend React installed and configured
- [x] Database connected (SQL Server)
- [x] Resend email configured and working
- [ ] Both backend and frontend servers running
- [ ] Test user accounts created

---

## 🚀 Quick Start Testing

### Step 1: Start the Servers

**Terminal 1 - Backend:**
```bash
cd backend
php artisan serve
```
Backend will run on: **http://localhost:8000**

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
Frontend will run on: **http://localhost:3000**

**Keep both terminals open during testing!**

---

## 🧪 Testing Workflow

### Phase 1: Basic System Test (10 minutes)

#### Test 1.1: Frontend Loads
- [ ] Open http://localhost:3000
- [ ] Home page loads without errors
- [ ] Navigation bar displays correctly
- [ ] FAQ chatbot button appears (bottom right)

**Expected**: Clean, professional homepage with gradient design

#### Test 1.2: Backend API
- [ ] Open http://localhost:8000/api in browser
- [ ] Should see Laravel API response or 404 (both are fine)

**Expected**: Backend is responding

#### Test 1.3: Database Connection
```bash
cd backend
php artisan tinker
```
Then run:
```php
DB::connection()->getPdo();
echo "Database connected!";
exit
```

**Expected**: "Database connected!" message

---

### Phase 2: User Registration & Authentication (15 minutes)

#### Test 2.1: Client Registration
1. Go to http://localhost:3000/register
2. Fill in the form:
   - **Name**: Test Client
   - **Email**: testclient@example.com
   - **Password**: password123
   - **Confirm Password**: password123
3. Click "Register"
4. Check for success message
5. **Check email** (should receive welcome email via Resend)

**Expected**: Registration successful, redirected to dashboard or login

#### Test 2.2: Client Login
1. Go to http://localhost:3000/login
2. Login with:
   - **Email**: testclient@example.com
   - **Password**: password123
3. Click "Login"

**Expected**: Redirected to client dashboard

#### Test 2.3: Lawyer Registration
1. Logout from client account
2. Go to http://localhost:3000/lawyer/register
3. Fill in the lawyer registration form:
   - **First Name**: John
   - **Last Name**: Lawyer
   - **Email**: testlawyer@example.com
   - **Password**: password123
   - **Phone**: 09171234567
   - **Office Address**: 123 Legal St, Manila
   - **Specializations**: Family Law, Corporate Law
   - **Years of Experience**: 5
   - **Bar Number**: 12345
   - **Upload Documents**: Upload test PDF files for credentials
4. Submit registration

**Expected**: Registration successful, pending approval message

---

### Phase 3: Admin Features (10 minutes)

#### Test 3.1: Admin Login
1. Login as super admin:
   - **Email**: admin@legalkonect.com
   - **Password**: password
2. Go to http://localhost:3000/admin

**Expected**: Admin dashboard with analytics

#### Test 3.2: Lawyer Verification
1. In admin dashboard, click "Verifications"
2. Find the pending lawyer (John Lawyer)
3. Click "View Details"
4. Review uploaded documents
5. Click "Approve"

**Expected**: Lawyer status changes to "Approved", email sent to lawyer

#### Test 3.3: Admin Navigation
Check all admin menu items work:
- [ ] Dashboard (analytics)
- [ ] Lawyers (list of all lawyers)
- [ ] Verifications (pending approvals)
- [ ] Payouts (if any)
- [ ] Admin Management (if super admin)

**Expected**: All pages load without errors

---

### Phase 4: Lawyer Features (15 minutes)

#### Test 4.1: Lawyer Login
1. Logout from admin
2. Login as lawyer:
   - **Email**: testlawyer@example.com
   - **Password**: password123
3. Go to http://localhost:3000/lawyer

**Expected**: Lawyer dashboard

#### Test 4.2: Profile Setup
1. Go to "Profile" in lawyer navigation
2. Update profile information:
   - **Consultation Fee**: ₱2000
   - **Bio**: Add professional bio
   - **Profile Photo**: Upload photo (optional)
3. Save changes

**Expected**: Profile updated successfully

#### Test 4.3: Schedule Setup
1. Go to "Schedule" in lawyer navigation
2. Set availability:
   - **Monday**: 9:00 AM - 5:00 PM
   - **Tuesday**: 9:00 AM - 5:00 PM
   - etc.
3. Save schedule

**Expected**: Schedule saved, can be viewed by clients

#### Test 4.4: Google Calendar Integration (Optional)
1. Go to "Google Calendar" in lawyer navigation
2. Click "Connect Google Calendar"
3. Authorize the app
4. Sync appointments

**Expected**: Google Calendar connected (or skip if not configured)

---

### Phase 5: Client Features (20 minutes)

#### Test 5.1: Lawyer Search
1. Logout and login as client
2. Go to "Search Lawyers"
3. Try different filters:
   - [ ] Search by specialization
   - [ ] Search by location
   - [ ] Filter by price range
   - [ ] Sort by rating/experience

**Expected**: Filtered results display correctly

#### Test 5.2: Lawyer Profile View
1. Click on a lawyer from search results
2. Review lawyer profile:
   - [ ] Profile information displays
   - [ ] Consultation fee shown
   - [ ] Ratings and reviews visible
   - [ ] Schedule/availability shown
   - [ ] "Book Appointment" button available

**Expected**: Complete lawyer profile with all details

#### Test 5.3: Book Appointment
1. Click "Book Appointment"
2. Select appointment details:
   - **Date**: Choose available date
   - **Time**: Choose available time slot
   - **Notes**: Add consultation notes
3. Click "Confirm Booking"

**Expected**: Booking confirmation, payment page

#### Test 5.4: Payment Processing
1. On payment page, choose payment method:
   - **PayMongo** (for testing)
2. Enter test card details:
   ```
   Card Number: 4343434343434345
   Expiry: 12/25
   CVC: 123
   Name: Test User
   ```
3. Submit payment

**Expected**:
- Payment successful
- Appointment confirmed
- **Email sent** to both client and lawyer
- Redirected to appointments page

#### Test 5.5: View Appointments
1. Go to "My Appointments"
2. Check appointment list:
   - [ ] Upcoming appointments shown
   - [ ] Appointment details correct
   - [ ] Payment status: Paid
   - [ ] Can view appointment details

**Expected**: Appointment visible with correct details

---

### Phase 6: Email System Test (5 minutes)

Check all emails are being sent via Resend:

1. **Go to Resend Dashboard**: https://resend.com/emails
2. **Verify emails sent**:
   - [ ] Client registration confirmation
   - [ ] Lawyer registration confirmation
   - [ ] Lawyer approval notification
   - [ ] Appointment booking confirmation (to client)
   - [ ] Appointment booking notification (to lawyer)
   - [ ] Payment receipt

**Expected**: All emails show "Delivered" status in Resend dashboard

---

### Phase 7: Enhanced FAQ Chatbot (10 minutes)

#### Test 7.1: Open FAQ Chatbot
1. Click the chatbot button (bottom right, blue circular button)
2. Chatbot opens with welcome screen

**Expected**: Modern gradient design, animated icon

#### Test 7.2: Browse by Category
1. Click "Browse FAQs" button
2. View categories with icons
3. Click on a category (e.g., "Getting Started")
4. View questions in that category
5. Click on a question
6. Read the answer

**Expected**:
- Smooth animations
- Categories load
- Questions display
- Answers show correctly

#### Test 7.3: Search Functionality
1. Go back to main chatbot screen
2. Click "Ask a Question"
3. Type: "How do I book an appointment?"
4. Press Enter or click Send

**Expected**:
- Typing indicator appears
- Answer displays with formatting
- Feedback buttons (👍 👎) appear

#### Test 7.4: Quick Replies & Popular Questions
1. Test popular questions on welcome screen
2. Test quick reply buttons if they appear
3. Test feedback buttons (thumbs up/down)

**Expected**: All interactions work smoothly

---

### Phase 8: Case Management (10 minutes)

#### Test 8.1: Client - View Cases
1. Login as client
2. Go to "My Cases"
3. Check if appointment created a case

**Expected**: Case created automatically from appointment

#### Test 8.2: Lawyer - Manage Cases
1. Login as lawyer
2. Go to "Cases"
3. Find the case from appointment
4. Update case status
5. Add case notes
6. Upload case documents

**Expected**: Case updates saved successfully

#### Test 8.3: Client - Upload Documents
1. Login as client
2. Go to case details
3. Upload relevant documents
4. Add notes

**Expected**: Documents uploaded and encrypted

---

### Phase 9: Review System (5 minutes)

#### Test 9.1: Leave Review (After Appointment)
1. Login as client
2. Go to completed appointments
3. Click "Leave Review"
4. Rate lawyer (1-5 stars)
5. Write review text
6. Submit review

**Expected**: Review saved, appears on lawyer profile

#### Test 9.2: View Reviews
1. Logout and search for lawyer
2. View lawyer profile
3. Check reviews section

**Expected**: Review displays on lawyer profile

---

### Phase 10: Payout System (Admin & Lawyer) (10 minutes)

#### Test 10.1: Lawyer - Request Payout
1. Login as lawyer
2. Go to "Earnings"
3. View earnings dashboard:
   - [ ] Available balance shown
   - [ ] Total earnings shown
   - [ ] Platform fees shown
   - [ ] Recent earnings table
4. Click "Request Payout"
5. Enter amount (up to available balance)
6. Submit request

**Expected**: Payout request created, status "Pending"

#### Test 10.2: Admin - Manage Payouts
1. Login as admin
2. Go to "Payouts" in admin panel
3. View pending payout requests
4. Click on payout request
5. Review details
6. Click "Approve"

**Expected**:
- Payout status changes to "Approved"
- Email sent to lawyer (when implemented)

#### Test 10.3: Admin - Mark as Paid
1. In admin payouts
2. Find approved payout
3. Click "Mark as Paid"

**Expected**: Payout status changes to "Paid"

---

## 🐛 Common Issues & Solutions

### Issue: "Connection refused" error
**Solution**: Make sure both backend and frontend servers are running

### Issue: "CORS error" in browser console
**Solution**: Check `FRONTEND_URL` in backend `.env` is set to `http://localhost:3000`

### Issue: Emails not sending
**Solution**:
1. Check Resend API key in `.env`
2. Verify `MAIL_MAILER=resend`
3. Check Resend dashboard for errors

### Issue: Payment fails
**Solution**: Use test card `4343434343434345` for PayMongo testing

### Issue: Google Maps not loading
**Solution**: Add Google Maps API key to `.env` (optional for basic testing)

### Issue: "Token expired" error
**Solution**: Logout and login again

---

## ✅ Testing Checklist Summary

### Core Features
- [ ] User Registration (Client)
- [ ] User Registration (Lawyer)
- [ ] Login/Logout
- [ ] Admin Dashboard
- [ ] Lawyer Verification
- [ ] Lawyer Search
- [ ] Appointment Booking
- [ ] Payment Processing
- [ ] Email Notifications
- [ ] FAQ Chatbot
- [ ] Case Management
- [ ] Review System
- [ ] Payout System

### Email Features
- [ ] Registration emails sent
- [ ] Appointment confirmation emails
- [ ] Payment receipts
- [ ] Lawyer approval notifications
- [ ] All emails delivered via Resend

### UI/UX Features
- [ ] Responsive design (test on different screen sizes)
- [ ] Smooth animations
- [ ] FAQ chatbot modern UI
- [ ] No console errors
- [ ] Fast page loads

---

## 📊 Performance Testing (Optional)

### Load Testing
1. Create multiple test appointments
2. Check page load times
3. Monitor database queries
4. Check email delivery speed

### Browser Testing
Test on different browsers:
- [ ] Chrome
- [ ] Firefox
- [ ] Edge
- [ ] Safari (if on Mac)

### Mobile Testing
Test on mobile devices or use browser dev tools:
- [ ] Responsive layout
- [ ] Touch interactions work
- [ ] Forms usable on mobile
- [ ] FAQ chatbot works on mobile

---

## 🎯 Success Criteria

Testing is successful if:

✅ **All core features work** without errors
✅ **Emails are delivered** via Resend
✅ **Payments process** successfully
✅ **No critical bugs** found
✅ **FAQ chatbot** displays correctly and functions
✅ **User experience** is smooth and intuitive

---

## 📝 Bug Reporting

If you find bugs during testing:

1. **Note the bug details**:
   - What were you trying to do?
   - What happened?
   - What should have happened?
   - Any error messages?

2. **Check browser console** (F12) for errors

3. **Check Laravel logs**: `backend/storage/logs/laravel.log`

4. **Take screenshots** if helpful

5. **Let me know** so I can fix it!

---

## 🚀 Next Steps After Testing

Once testing is complete:

1. **Review all findings**
2. **Fix any bugs** discovered
3. **Merge to develop branch** if all tests pass
4. **Prepare for production deployment**
5. **Set up production environment** (domain, Resend verification, etc.)

---

**Ready to start testing?** Follow the phases above in order, and check off items as you go! 🧪

**Estimated Total Testing Time**: 2-3 hours for complete testing

**Last Updated**: 2025-11-22
