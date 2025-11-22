# Payout System Testing Guide

## Prerequisites
Before testing, ensure:
- ✅ Backend server is running (`php artisan serve`)
- ✅ Frontend server is running (`npm run dev`)
- ✅ Database migrations are complete
- ✅ You have test accounts (1 client, 1 lawyer, 1 admin)

## Test Scenario Overview
We'll simulate the complete payout flow:
1. Client books and pays for appointment
2. Lawyer completes appointment
3. System automatically creates earning record
4. Lawyer sets up payout information
5. Lawyer requests payout
6. Admin approves payout
7. Admin marks payout as paid

---

## Step 1: Create Test Accounts

### 1.1 Create Test Client Account
1. Go to `http://localhost:5173/register`
2. Register as a client:
   - Name: `Test Client`
   - Email: `testclient@example.com`
   - Password: `password123`
3. Login and verify account works

### 1.2 Create Test Lawyer Account
1. Go to `http://localhost:5173/lawyer-register`
2. Register as a lawyer:
   - First Name: `Test`
   - Last Name: `Lawyer`
   - Email: `testlawyer@example.com`
   - Password: `password123`
   - Fill in all required fields (license number, hourly rate, etc.)
   - Upload required documents
3. **Admin must approve this lawyer first**

### 1.3 Approve Lawyer (Admin Action)
1. Login as admin at `http://localhost:5173/admin`
2. Go to Admin Verifications
3. Find "Test Lawyer" in pending verifications
4. Review documents and approve the lawyer

---

## Step 2: Create and Complete an Appointment

### 2.1 Book Appointment (as Client)
1. Login as `testclient@example.com`
2. Go to Lawyer Search page
3. Find "Test Lawyer" and click "View Profile"
4. Click "Book Appointment"
5. Select a date and time
6. Enter case details:
   - Case Type: e.g., "Criminal Defense"
   - Description: "Test case for payout testing"
7. Click "Proceed to Payment"

### 2.2 Complete Payment (as Client)
**Option A: Using PayMongo Test Mode**
1. On payment page, use PayMongo test card:
   - Card Number: `4120 0000 0000 0007`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)
   - Name: Any name
2. Click "Pay Now"
3. Wait for payment confirmation

**Option B: Manual Payment Simulation (Database)**
If PayMongo is not set up, you can manually mark the appointment as paid:
```sql
-- Find the appointment
SELECT * FROM appointments ORDER BY id DESC LIMIT 1;

-- Update payment status
UPDATE appointments
SET payment_status = 'paid', status = 'confirmed'
WHERE id = [appointment_id];
```

### 2.3 Verify Payment
1. Check that appointment status changed to "confirmed"
2. Client should see appointment in their appointments list

---

## Step 3: Complete the Appointment (as Lawyer)

### 3.1 Accept Appointment
1. Login as `testlawyer@example.com`
2. Go to Lawyer Dashboard or Appointments
3. Find the pending appointment
4. Click "Accept" button

### 3.2 Complete Appointment
1. In appointments list, find the confirmed appointment
2. Click "Complete" button
3. Add notes (optional): "Consultation completed successfully"
4. Confirm completion

### 3.3 Verify Earning Record Created
**Check via Database:**
```sql
-- Check earning was created
SELECT
    e.*,
    a.consultation_fee,
    l.first_name,
    l.last_name
FROM earnings e
JOIN appointments a ON e.appointment_id = a.id
JOIN lawyers l ON e.lawyer_id = l.id
ORDER BY e.id DESC LIMIT 1;
```

**Expected Result:**
- `gross_amount`: Should equal appointment consultation fee
- `platform_fee`: Should be 20% of gross amount
- `net_amount`: Should be 80% of gross amount (gross - platform_fee)
- `status`: Should be 'completed'
- `completed_at`: Should have a timestamp

**Example Calculation:**
If consultation fee = ₱1,000:
- gross_amount = ₱1,000.00
- platform_fee = ₱200.00 (20%)
- net_amount = ₱800.00 (80%)

---

## Step 4: Set Up Payout Information (as Lawyer)

### 4.1 Navigate to Earnings Page
1. Login as `testlawyer@example.com`
2. Click on "Earnings" in the lawyer navigation menu
3. You should see:
   - **Available Balance**: ₱800.00 (or your net amount)
   - **Total Earnings**: ₱800.00
   - **Platform Fees**: ₱200.00
   - **Pending Payouts**: ₱0.00

### 4.2 Warning Alert
You should see a yellow warning alert:
- "Payout Information Required"
- "Please set up your GCash or bank account information to receive payouts"
- Click "Set Up Now" button

### 4.3 Set Up GCash Information
1. In the Payout Settings modal:
   - Select "GCash" as preferred method
   - Enter GCash Number: `09171234567`
   - Enter GCash Account Name: `Test Lawyer`
2. Click "Save Changes"
3. You should see success message: "Payout information updated successfully!"

**Alternative: Set Up Bank Information**
1. Select "Bank Transfer" as preferred method
2. Enter Bank Name: `BDO`
3. Enter Bank Account Number: `1234567890`
4. Enter Bank Account Name: `Test Lawyer`
5. Click "Save Changes"

### 4.4 Verify Payout Info Saved
**Check via Database:**
```sql
SELECT
    id,
    first_name,
    last_name,
    gcash_number,
    gcash_account_name,
    bank_name,
    bank_account_number,
    bank_account_name,
    preferred_payout_method
FROM lawyers
WHERE id = [lawyer_id];
```

---

## Step 5: Request Payout (as Lawyer)

### 5.1 Click Request Payout Button
1. On Earnings page, click "Request Payout" button (under Available Balance card)
2. The Request Payout modal should open

### 5.2 Review Payout Information
The modal should display:
- **Available Balance**: ₱800.00
- **Minimum Payout**: ₱500.00
- **Payout Method**: GCASH (or BANK)
- **Account**: 09171234567 (your GCash number or bank details)

### 5.3 Enter Payout Amount
1. In "Payout Amount" field, enter: `800`
2. Click "Submit Request"
3. You should see success message: "Payout request submitted successfully!"

### 5.4 Verify Request Created
**Check UI:**
- Available Balance should now be: ₱0.00
- Pending Payouts should now be: ₱800.00
- In "Payout History" table, you should see:
  - Amount: ₱800.00
  - Method: GCASH
  - Account: 09171234567
  - Status: **Pending** (yellow badge with clock icon)

**Check via Database:**
```sql
SELECT
    p.*,
    l.first_name,
    l.last_name
FROM payouts p
JOIN lawyers l ON p.lawyer_id = l.id
ORDER BY p.id DESC LIMIT 1;
```

**Expected Result:**
- `amount`: 800.00
- `payout_method`: 'gcash'
- `payout_account_number`: '09171234567'
- `status`: 'pending'
- `requested_at`: Current timestamp
- `approved_at`: NULL
- `paid_at`: NULL

---

## Step 6: Approve Payout (as Admin)

### 6.1 Access Admin Payout Management
1. Login as admin at `http://localhost:5173/admin`
2. Navigate to "Payouts" or "Payout Management" in admin menu
   - **Note:** You may need to add this to the admin navigation menu if it's not there yet

### 6.2 View Pending Payouts
You should see:
- **Summary Stats Cards** showing:
  - Pending: 1 payout, ₱800.00
  - Other statuses with 0
- **Filter dropdown** set to "All Status"
- **Payouts table** with one row:
  - Lawyer: Test Lawyer (testlawyer@example.com)
  - Amount: ₱800.00
  - Method: GCASH
  - Account: 09171234567
  - Status: **Pending** (yellow badge)
  - Actions: **Approve** and **Reject** buttons

### 6.3 Approve the Payout
1. Click the **"Approve"** button
2. Review the approval modal:
   - Lawyer: Test Lawyer
   - Amount: ₱800.00
   - Payout Method: GCASH
   - Account: 09171234567
   - Warning note about manual transfer
3. Click **"Approve Payout"** button
4. You should see success message: "Payout approved successfully!"

### 6.4 Verify Approval
**Check UI:**
- Payout status should change to **"Approved"** (blue badge with check icon)
- Action button should change to **"Mark as Paid"**
- Summary stats should update:
  - Pending: 0
  - Approved: 1, ₱800.00

**Check via Database:**
```sql
SELECT
    id,
    lawyer_id,
    amount,
    status,
    approved_at,
    processed_by
FROM payouts
WHERE id = [payout_id];
```

**Expected Result:**
- `status`: 'approved'
- `approved_at`: Current timestamp
- `processed_by`: Admin user ID

---

## Step 7: Manually Transfer Funds (Outside System)

**IMPORTANT:** This step happens OUTSIDE the LegalKonect system.

### 7.1 Perform Manual Transfer
The admin must now manually transfer the funds:

**For GCash:**
1. Open GCash app
2. Send money to: `09171234567`
3. Amount: ₱800.00
4. Add message: "LegalKonect Payout - Appointment #[ID]"
5. Complete transfer
6. **Save the transaction reference number** (e.g., "GC12345678")

**For Bank Transfer:**
1. Login to online banking or go to bank branch
2. Transfer to:
   - Bank: BDO
   - Account Number: 1234567890
   - Account Name: Test Lawyer
3. Amount: ₱800.00
4. Purpose: "LegalKonect Payout"
5. Complete transfer
6. **Save the transaction reference number**

---

## Step 8: Mark Payout as Paid (as Admin)

### 8.1 Open Mark as Paid Modal
1. Back in Admin Payout Management
2. Find the approved payout
3. Click **"Mark as Paid"** button

### 8.2 Enter Transaction Details
1. In "Transaction Reference" field, enter: `GC12345678` (your actual reference)
2. In "Admin Notes" (optional), enter: `Transferred via GCash on [date]`
3. Click **"Mark as Paid"** button
4. You should see success message: "Payout marked as paid successfully!"

### 8.3 Verify Payment Marked
**Check UI:**
- Payout status should change to **"Paid"** (green badge with check icon)
- Transaction Reference column should show: `GC12345678`
- Action column should show: `-` (no more actions)
- Summary stats should update:
  - Approved: 0
  - Paid: 1, ₱800.00

**Check via Database:**
```sql
SELECT
    id,
    amount,
    status,
    transaction_reference,
    admin_notes,
    paid_at
FROM payouts
WHERE id = [payout_id];
```

**Expected Result:**
- `status`: 'paid'
- `transaction_reference`: 'GC12345678'
- `admin_notes`: 'Transferred via GCash on [date]'
- `paid_at`: Current timestamp

---

## Step 9: Verify Lawyer Can See Completed Payout

### 9.1 Check Lawyer Earnings Page
1. Login as `testlawyer@example.com`
2. Go to Earnings page
3. You should see:
   - **Available Balance**: ₱0.00
   - **Total Earnings**: ₱800.00
   - **Pending Payouts**: ₱0.00

### 9.2 Check Payout History
In the "Payout History" table:
- Amount: ₱800.00
- Method: GCASH
- Account: 09171234567
- Status: **Paid** (green badge)
- Reference: **GC12345678**

**Success!** The lawyer can now see that their payout was completed with the transaction reference.

---

## Additional Test Scenarios

### Test Scenario 2: Reject Payout
1. Create another appointment and complete it (follow Steps 2-5)
2. As admin, instead of approving, click **"Reject"** button
3. Enter rejection reason: "Invalid bank account information"
4. Click "Reject Payout"
5. Verify:
   - Status changes to **"Rejected"** (red badge with X icon)
   - Lawyer can see rejection reason in payout history
   - Lawyer's available balance returns to previous amount

### Test Scenario 3: Insufficient Balance
1. As lawyer with ₱400 available balance
2. Try to request payout of ₱500
3. Should show error: "Insufficient balance"

### Test Scenario 4: Below Minimum Amount
1. As lawyer with ₱800 available balance
2. Try to request payout of ₱400
3. Should show error: "Minimum payout amount is ₱500"

### Test Scenario 5: Multiple Earnings
1. Create and complete 3 appointments (follow Steps 2-3 three times)
2. Verify:
   - Available balance = sum of all net amounts
   - Recent Earnings table shows all 3 earnings
3. Request payout for partial amount (e.g., ₱1,000 out of ₱2,400)
4. Verify remaining balance is correct

### Test Scenario 6: Request Without Payout Info
1. Create a new lawyer account
2. Complete an appointment to earn money
3. Try to request payout without setting up GCash/Bank info
4. Should show alert: "Please set up your GCash information first"
5. Should redirect to Payout Settings modal

---

## Database Verification Queries

### Check All Earnings
```sql
SELECT
    e.id,
    l.first_name,
    l.last_name,
    e.gross_amount,
    e.platform_fee,
    e.net_amount,
    e.status,
    e.completed_at
FROM earnings e
JOIN lawyers l ON e.lawyer_id = l.id
ORDER BY e.id DESC;
```

### Check All Payouts
```sql
SELECT
    p.id,
    l.first_name,
    l.last_name,
    p.amount,
    p.payout_method,
    p.status,
    p.requested_at,
    p.approved_at,
    p.paid_at,
    p.transaction_reference
FROM payouts p
JOIN lawyers l ON p.lawyer_id = l.id
ORDER BY p.id DESC;
```

### Check Lawyer Balance
```sql
SELECT
    l.first_name,
    l.last_name,
    COALESCE(SUM(e.net_amount), 0) as total_earnings,
    COALESCE(
        (SELECT SUM(amount)
         FROM payouts
         WHERE lawyer_id = l.id
         AND status IN ('approved', 'processing', 'paid', 'pending')),
        0
    ) as total_payouts,
    COALESCE(SUM(e.net_amount), 0) - COALESCE(
        (SELECT SUM(amount)
         FROM payouts
         WHERE lawyer_id = l.id
         AND status IN ('approved', 'processing', 'paid', 'pending')),
        0
    ) as available_balance
FROM lawyers l
LEFT JOIN earnings e ON l.id = e.lawyer_id AND e.status = 'completed'
WHERE l.id = [lawyer_id]
GROUP BY l.id, l.first_name, l.last_name;
```

---

## Troubleshooting

### Issue: Earning record not created after payment
**Check:**
1. Verify payment status is 'paid': `SELECT payment_status FROM appointments WHERE id = [id]`
2. Check if earning already exists: `SELECT * FROM earnings WHERE appointment_id = [id]`
3. Look for errors in Laravel log: `backend/storage/logs/laravel.log`

**Fix:**
Manually create earning record:
```sql
INSERT INTO earnings
    (lawyer_id, appointment_id, gross_amount, platform_fee, net_amount, platform_fee_percentage, status, completed_at, created_at, updated_at)
VALUES
    ([lawyer_id], [appointment_id], 1000.00, 200.00, 800.00, 20.00, 'completed', NOW(), NOW(), NOW());
```

### Issue: Available balance shows incorrect amount
**Check:**
1. Sum all completed earnings
2. Sum all payouts (pending, approved, processing, paid)
3. Available = Total Earnings - Total Payouts

**Debug Query:**
```sql
-- Check lawyer's financial summary
SELECT
    'Total Earnings' as type,
    SUM(net_amount) as amount
FROM earnings
WHERE lawyer_id = [lawyer_id] AND status = 'completed'

UNION ALL

SELECT
    'Total Payouts' as type,
    SUM(amount) as amount
FROM payouts
WHERE lawyer_id = [lawyer_id]
AND status IN ('pending', 'approved', 'processing', 'paid');
```

### Issue: Request Payout button disabled
**Reasons:**
1. Available balance is less than ₱500
2. Payout info not set up
3. JavaScript error (check browser console)

### Issue: Admin can't see payouts
**Check:**
1. Admin is logged in: `sessionStorage.getItem('admin_token')`
2. Admin routes are working: Test `GET /api/admin/payouts/pending`
3. CORS is configured correctly
4. Check browser Network tab for API errors

---

## Success Criteria

✅ **The payout system is working correctly if:**

1. ✅ Earning record is automatically created when appointment is paid
2. ✅ Commission split is calculated correctly (80/20)
3. ✅ Lawyer can set up GCash or bank information
4. ✅ Lawyer can request payout when balance ≥ ₱500
5. ✅ Request is blocked if payout info is not set up
6. ✅ Admin can view all pending payouts
7. ✅ Admin can approve payout requests
8. ✅ Admin can mark payouts as paid with transaction reference
9. ✅ Admin can reject payouts with reason
10. ✅ Status badges and action buttons display correctly
11. ✅ Available balance is calculated accurately
12. ✅ Payout history is displayed correctly for both lawyer and admin
13. ✅ Transaction references are stored and displayed
14. ✅ All timestamps are recorded correctly

---

## Next Steps After Testing

1. **Fix any bugs** found during testing
2. **Add admin payout navigation** to the admin menu (if not already there)
3. **Set up email notifications** (optional but recommended):
   - Notify lawyer when payout is approved
   - Notify lawyer when payout is paid
   - Notify lawyer when payout is rejected
4. **Configure production values** in `.env`:
   - Set actual platform fee percentage
   - Set appropriate minimum payout amount
5. **Set up PayMongo production credentials**
6. **Document manual transfer process** for admins
7. **Train admins** on how to process payouts

---

## Support

If you encounter any issues during testing:
1. Check Laravel logs: `backend/storage/logs/laravel.log`
2. Check browser console for JavaScript errors
3. Check Network tab for API request/response errors
4. Verify database records using the SQL queries provided
5. Check that all migrations ran successfully: `php artisan migrate:status`

Happy Testing! 🎉
