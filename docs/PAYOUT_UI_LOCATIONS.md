# Payout System UI Locations

## Admin Payout Management

### Navigation
**Location:** Admin Sidebar (after "Payments")
- **File:** `frontend/src/pages/admin/AdminDashboard.tsx` (lines 183-195)
- **Icon:** Cash/Money transfer icon
- **Label:** "Payouts"
- **Route:** `/admin/payouts`

### Page Component
**File:** `frontend/src/pages/admin/AdminPayouts.tsx`
- Full payout management interface for admins
- View all payouts with filtering
- Approve/Reject payout requests
- Mark payouts as paid with transaction reference

### Route Configuration
**File:** `frontend/src/App.tsx`
- **Import:** Line 41 - `import AdminPayouts from './pages/admin/AdminPayouts';`
- **Route:** Line 164 - `<Route path="payouts" element={<AdminPayouts />} />`

### How to Access
1. Login as admin at `http://localhost:5173/admin`
2. Click "Payouts" in the left sidebar (between "Payments" and "FAQs")
3. Or navigate directly to: `http://localhost:3000/admin/payouts`

---

## Lawyer Earnings & Payout Request

### Navigation
**Location:** Lawyer Sidebar
- **File:** `frontend/src/pages/lawyer/LawyerLayout.tsx`
- **Label:** "Earnings" (already exists in your lawyer menu)
- **Route:** `/lawyer/earnings`

### Page Component
**File:** `frontend/src/pages/lawyer/LawyerEarnings.tsx`
- Replaced the old earnings component with the new payout-enabled version
- Summary cards showing available balance, total earnings, fees, pending payouts
- Recent earnings table with commission breakdown
- Payout history table
- Request payout functionality
- Payout settings (GCash or Bank)

### How to Access
1. Login as lawyer at `http://localhost:5173/login`
2. Click "Earnings" in the lawyer navigation
3. Or navigate directly to: `http://localhost:3000/lawyer/earnings`

---

## API Services

### Lawyer API
**File:** `frontend/src/services/lawyerApi.ts`
- `getEarnings()` - Get earnings summary
- `updatePayoutInfo()` - Update GCash/Bank info
- `requestPayout(amount)` - Request payout
- `getPayouts()` - Get payout history

### Admin API
**File:** `frontend/src/services/adminApi.ts`
- New export: `adminPayoutService`
- `getPayouts(status?, page?, perPage?)` - Get all payouts
- `getPendingPayouts()` - Get pending payouts
- `approvePayout(id)` - Approve payout
- `markAsPaid(id, {transaction_reference, admin_notes?})` - Mark as paid
- `rejectPayout(id, {rejection_reason})` - Reject payout

---

## Visual Guide

### Admin Sidebar Menu Order
```
Dashboard
Lawyers
Verifications
Appointments
Users
Payments          <- Existing
Payouts           <- NEW! (Added here)
FAQs
Analytics
Admin Management (Super Admin only)
```

### Lawyer Menu (No changes needed - already has Earnings)
```
Dashboard
Appointments
Cases
Schedule
Earnings          <- Updated with payout features
Google Calendar
Profile
```

---

## Testing Access

### Test as Admin:
1. Go to: `http://localhost:3000/admin`
2. Login with admin credentials
3. Click "Payouts" in sidebar
4. You should see the Payout Management page

### Test as Lawyer:
1. Go to: `http://localhost:3000/login`
2. Login as a lawyer
3. Click "Earnings" in navigation
4. You should see the updated Earnings & Payouts page

---

## Screenshot Guide

When you access `/admin/payouts`, you'll see:
- **Filter dropdown** at top right (filter by status)
- **5 Summary cards** showing counts and totals for each status
- **Payouts table** with columns:
  - Lawyer (name + email)
  - Amount
  - Method & Account
  - Requested (date)
  - Status (colored badge)
  - Reference (transaction ID)
  - Actions (Approve/Reject or Mark as Paid buttons)

When you access `/lawyer/earnings`, you'll see:
- **4 Summary cards** at top (Available Balance, Total Earnings, Platform Fees, Pending Payouts)
- **Recent Earnings table** showing commission breakdown
- **Payout History table** showing all payout requests
- **Request Payout button** in Available Balance card
- **Payout Settings button** at top right

---

## Quick Navigation URLs

- **Admin Payouts:** `http://localhost:3000/admin/payouts`
- **Lawyer Earnings:** `http://localhost:3000/lawyer/earnings`

Both pages are now fully integrated into the navigation system!
