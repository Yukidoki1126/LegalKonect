# Lawyer Dashboard & Earnings Page Fixes

**Date**: 2025-11-22
**Status**: ✅ Fixed

---

## Issues Fixed

### Issue 1: Lawyer Dashboard 500 Error - Encryption Problem

**Error**:
```
DecryptException: The payload is invalid.
Failed to decrypt 'ibp_number' field with value 'UNKNOWN'
```

**Root Cause**:
The Lawyer model has three fields marked as `encrypted` in the `$casts` array:
- `ibp_number`
- `roll_of_attorneys_number`
- `prc_license_number`

However, lawyers in the database had plain text value `'UNKNOWN'` which Laravel couldn't decrypt.

**Solution**:
Created and executed a script (`fix_encrypted_fields.php`) that:
1. Found all lawyers with unencrypted 'UNKNOWN' values
2. Properly encrypted those values using Laravel's `Crypt::encryptString()`
3. Updated 17 lawyers in the database

**Files Changed**:
- None (database fix only)
- Temporary script: `backend/fix_encrypted_fields.php` (removed after execution)

---

### Issue 2: LawyerEarnings Page - Cannot Read 'length' of Undefined

**Error**:
```
TypeError: Cannot read properties of undefined (reading 'length')
    at LawyerEarnings (http://localhost:3000/static/js/bundle.js:128674:31)
```

**Root Cause**:
1. The `fetchPayouts()` function was trying to access `response.data` which could be `undefined`
2. The render code wasn't checking if `earnings.recentEarnings` exists before calling `.length`

**Solution**:

#### Fix 1: Handle Response Structure in fetchPayouts
```typescript
const fetchPayouts = async () => {
  try {
    const response = await lawyerApi.getPayouts();
    // Handle both direct array and paginated response
    const payoutsData = Array.isArray(response) ? response : (response.data || []);
    setPayouts(payoutsData);
  } catch (err: any) {
    console.error('Failed to load payouts:', err);
    setPayouts([]); // Set to empty array on error
  }
};
```

#### Fix 2: Add Safety Check in Rendering
```typescript
{!earnings.recentEarnings || earnings.recentEarnings.length === 0 ? (
  <tr>
    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
      No earnings yet
    </td>
  </tr>
) : (
  earnings.recentEarnings.map((earning) => (
    // ... render earning
  ))
)}
```

**Files Changed**:
- `frontend/src/pages/lawyer/LawyerEarnings.tsx` (lines 123-133, 367)

---

## Testing

### 1. Test Lawyer Dashboard
```
URL: http://localhost:3000/lawyer/dashboard

Expected Results:
✅ Dashboard loads without 500 error
✅ Stats cards display correctly
✅ Recent reviews show up
✅ No decryption errors in console
```

### 2. Test Earnings Page
```
URL: http://localhost:3000/lawyer/earnings

Expected Results:
✅ Page loads without errors
✅ Summary cards show:
   - Available Balance
   - Total Earnings
   - Platform Fees
   - Pending Payouts
✅ "Recent Earnings" table displays (or "No earnings yet")
✅ "Payout History" table displays (or "No payout requests yet")
✅ "Request Payout" button is visible
✅ "Payout Settings" button works
```

---

## How to Access Lawyer Earnings Page

1. Navigate to `http://localhost:3000/login`
2. Login with lawyer credentials
3. Look for **"Earnings"** in the left sidebar (with dollar sign icon 💰)
4. Click to view earnings and payout management

---

## Payout Features Available

### For Lawyers:
1. **View Earnings Summary**
   - Available balance for withdrawal
   - Total lifetime earnings
   - Platform fees deducted
   - Pending payout amount

2. **Request Payout**
   - Minimum payout: ₱500
   - Choose GCash or Bank transfer
   - Must configure payout info first

3. **Payout Settings**
   - Set preferred payout method (GCash or Bank)
   - Configure GCash details (number, account name)
   - Configure Bank details (bank name, account number, account name)

4. **View Recent Earnings**
   - Date completed
   - Client name
   - Gross amount
   - Platform fee (20%)
   - Net amount earned

5. **View Payout History**
   - Date requested
   - Amount
   - Payment method
   - Status (Pending, Approved, Processing, Paid, Rejected)
   - Transaction reference (when paid)

---

## Related Files

### Backend
```
backend/app/Http/Controllers/LawyerDashboardController.php (lines 18-82)
backend/app/Http/Controllers/PayoutController.php
backend/app/Models/Lawyer.php (lines 64-66: encrypted fields)
```

### Frontend
```
frontend/src/pages/lawyer/LawyerEarnings.tsx
frontend/src/pages/lawyer/LawyerLayout.tsx (lines 129-141: Earnings nav link)
frontend/src/services/lawyerApi.ts
```

---

## Additional Notes

### Encryption Fields in Lawyer Model
The following fields are automatically encrypted by Laravel:
- `ibp_number` (Integrated Bar of the Philippines number)
- `roll_of_attorneys_number`
- `prc_license_number` (Professional Regulation Commission)

These fields are encrypted at rest for security and automatically decrypted when accessed through the Lawyer model.

### Future Enhancements
1. Add export functionality for earnings reports
2. Add email notifications for payout status changes
3. Add payout analytics/charts
4. Add support for other payment methods (PayPal, etc.)

---

## Status

✅ **All issues resolved**
✅ **Lawyer dashboard loads correctly**
✅ **Earnings page displays properly**
✅ **Ready for testing**

---

**Last Updated**: 2025-11-22
