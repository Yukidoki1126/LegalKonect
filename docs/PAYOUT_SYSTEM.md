# Payout System Implementation Summary

## Overview
Implemented a comprehensive **Phase 1: Semi-Automated Manual Payout System** where the platform holds payments and administrators manually process payouts to lawyers via GCash or bank transfer.

## System Architecture

### Payment Flow
1. **Client Payment** → Platform receives payment via PayMongo
2. **Automatic Commission Split** → 80% to lawyer, 20% to platform
3. **Earning Record Created** → Tracks gross amount, platform fee, and net amount
4. **Lawyer Payout Request** → Lawyer requests withdrawal of available balance (min ₱500)
5. **Admin Approval** → Admin reviews and approves payout request
6. **Manual Transfer** → Admin manually transfers funds via GCash/Bank
7. **Mark as Paid** → Admin confirms transfer with transaction reference

## Database Changes

### 1. Lawyers Table (Migration: `2025_11_21_141806_add_payout_fields_to_lawyers_table`)
Added payout information fields:
- `gcash_number` - Lawyer's GCash mobile number
- `gcash_account_name` - Name registered on GCash
- `bank_name` - Bank name (e.g., BDO, BPI, Metrobank)
- `bank_account_number` - Bank account number
- `bank_account_name` - Name registered with bank
- `preferred_payout_method` - ENUM('gcash', 'bank') DEFAULT 'gcash'

### 2. Earnings Table (Migration: `2025_11_21_141855_create_earnings_table`)
Tracks all lawyer earnings from completed appointments:
- `lawyer_id` - Foreign key to lawyers table
- `appointment_id` - Foreign key to appointments table
- `gross_amount` - Total payment from client (DECIMAL 10,2)
- `platform_fee` - Platform commission (DECIMAL 10,2)
- `net_amount` - Amount lawyer receives (DECIMAL 10,2)
- `platform_fee_percentage` - Commission percentage (DECIMAL 5,2, default 20.00)
- `status` - ENUM('pending', 'completed', 'refunded') DEFAULT 'pending'
- `completed_at` - Timestamp when earning was completed
- `refunded_at` - Timestamp if earning was refunded
- `notes` - Additional notes

**Indexes:**
- `lawyer_id` for fast lawyer lookups
- `appointment_id` for appointment tracking
- `status` for filtering earnings by status

### 3. Payouts Table (Migration: `2025_11_21_141950_create_payouts_table`)
Tracks payout requests from lawyers:
- `lawyer_id` - Foreign key to lawyers table (ON DELETE CASCADE)
- `amount` - Payout amount (DECIMAL 10,2)
- `payout_method` - ENUM('gcash', 'bank')
- `payout_account_number` - Account/mobile number for payout
- `payout_account_name` - Account holder name
- `bank_name` - Bank name (nullable, for bank transfers)
- `status` - ENUM('pending', 'approved', 'processing', 'paid', 'rejected') DEFAULT 'pending'
- `requested_at` - Timestamp of payout request
- `approved_at` - Timestamp when admin approved
- `paid_at` - Timestamp when payout was completed
- `rejected_at` - Timestamp if payout was rejected
- `processed_by` - Foreign key to users (admin who processed)
- `admin_notes` - Admin notes about the payout
- `rejection_reason` - Reason if payout was rejected
- `transaction_reference` - Reference number from GCash/Bank transfer

**Indexes:**
- `lawyer_id` for fast lawyer lookups
- `status` for filtering payouts by status
- `processed_by` for tracking which admin processed

**Note:** The `processed_by` foreign key uses `onDelete('no action')` instead of cascade to avoid SQL Server cascade path conflicts.

## Backend Implementation

### 1. Models

#### Earning Model (`app/Models/Earning.php`)
- **Relationships:**
  - `belongsTo(Lawyer::class)`
  - `belongsTo(Appointment::class)`
- **Scopes:**
  - `completed()` - Filter completed earnings
  - `forLawyer($lawyerId)` - Filter by lawyer

#### Payout Model (`app/Models/Payout.php`)
- **Relationships:**
  - `belongsTo(Lawyer::class)`
  - `belongsTo(User::class, 'processed_by')` - Admin who processed
- **Scopes:**
  - `pending()` - Filter pending payouts
  - `approved()` - Filter approved payouts
  - `paid()` - Filter paid payouts
  - `forLawyer($lawyerId)` - Filter by lawyer

#### Lawyer Model Updates (`app/Models/Lawyer.php`)
Added relationships and helper methods:
- **Relationships:**
  - `earnings()` - Has many Earning
  - `payouts()` - Has many Payout
- **Helpers:**
  - `available_balance` - Calculate available balance (earnings - payouts)
  - `total_platform_fees` - Sum of all platform fees
  - `total_net_earnings` - Sum of all net earnings
  - `pending_payouts` - Sum of pending payout amounts

### 2. PaymentController Updates (`app/Http/Controllers/PaymentController.php`)
Added automatic earning record creation:
- **New Method:** `createEarningRecord(Appointment $appointment)`
  - Calculates 80/20 split automatically
  - Creates earning record with completed status
  - Prevents duplicate earning records
  - Called in 3 places: `attachPaymentMethod()`, `webhook()`, `handleSourceCallback()`

### 3. PayoutController (`app/Http/Controllers/PayoutController.php`)
Comprehensive controller with 9 endpoints:

#### Lawyer Endpoints:
1. **`getEarnings()`** - GET `/lawyer/earnings`
   - Returns earnings summary with available balance
   - Includes recent earnings (last 20)
   - Returns payout information (GCash/Bank details)

2. **`updatePayoutInfo()`** - PUT `/lawyer/payout-info`
   - Updates GCash or bank account information
   - Validates required fields based on payout method
   - Updates preferred payout method

3. **`requestPayout()`** - POST `/lawyer/payouts/request`
   - Creates new payout request
   - Validates minimum amount (₱500)
   - Checks available balance
   - Verifies payout info is set up
   - Status set to 'pending'

4. **`getPayouts()`** - GET `/lawyer/payouts`
   - Returns payout history for the lawyer
   - Ordered by most recent first

#### Admin Endpoints:
5. **`getPendingPayouts()`** - GET `/admin/payouts/pending`
   - Returns all pending payout requests
   - Includes lawyer information
   - Ordered by oldest first (FIFO)

6. **`getAllPayouts()`** - GET `/admin/payouts`
   - Returns all payouts with optional status filter
   - Supports pagination
   - Includes lawyer and admin information

7. **`approvePayout()`** - POST `/admin/payouts/{id}/approve`
   - Approves a pending payout
   - Updates status to 'approved'
   - Records admin who approved
   - Records approval timestamp

8. **`markAsPaid()`** - POST `/admin/payouts/{id}/mark-paid`
   - Marks payout as paid after manual transfer
   - Requires transaction reference
   - Optional admin notes
   - Updates status to 'paid'
   - Records paid timestamp

9. **`rejectPayout()`** - POST `/admin/payouts/{id}/reject`
   - Rejects a payout request
   - Requires rejection reason
   - Updates status to 'rejected'
   - Records rejection timestamp

### 4. Routes (`routes/api.php`)

#### Lawyer Routes (Inside `lawyer` middleware group):
```php
Route::get('/earnings', [PayoutController::class, 'getEarnings']);
Route::put('/payout-info', [PayoutController::class, 'updatePayoutInfo']);
Route::post('/payouts/request', [PayoutController::class, 'requestPayout']);
Route::get('/payouts', [PayoutController::class, 'getPayouts']);
```

#### Admin Routes (Inside `admin` middleware group):
```php
Route::get('/payouts/pending', [PayoutController::class, 'getPendingPayouts']);
Route::get('/payouts', [PayoutController::class, 'getAllPayouts']);
Route::post('/payouts/{id}/approve', [PayoutController::class, 'approvePayout']);
Route::post('/payouts/{id}/mark-paid', [PayoutController::class, 'markAsPaid']);
Route::post('/payouts/{id}/reject', [PayoutController::class, 'rejectPayout']);
```

### 5. Configuration (`config/app.php`)
Added configurable values:
```php
'platform_fee_percentage' => env('PLATFORM_FEE_PERCENTAGE', 20.00),
'minimum_payout_amount' => env('MINIMUM_PAYOUT_AMOUNT', 500.00),
```

## Frontend Implementation

### 1. Lawyer Earnings Dashboard (`frontend/src/pages/lawyer/LawyerEarnings.tsx`)

**Features:**
- **Summary Cards:**
  - Available Balance (with Request Payout button)
  - Total Earnings (net amount after fees)
  - Platform Fees (total 20% commission)
  - Pending Payouts (sum of all pending requests)

- **Recent Earnings Table:**
  - Date, Client, Gross Amount, Platform Fee, Net Amount
  - Shows breakdown of each earning
  - Platform fee shown in red, net amount in green

- **Payout History Table:**
  - Request date, Amount, Method (GCash/Bank), Account, Status, Reference
  - Color-coded status badges
  - Transaction reference when paid

- **Request Payout Modal:**
  - Shows available balance and minimum amount (₱500)
  - Input for payout amount with validation
  - Displays current payout method and account
  - Validates sufficient balance
  - Checks if payout info is set up

- **Payout Settings Modal:**
  - Choose preferred payout method (GCash or Bank)
  - **GCash Fields:** Mobile number, Account name
  - **Bank Fields:** Bank name, Account number, Account name
  - Conditional form rendering based on method
  - Validation for required fields

- **Payout Info Alert:**
  - Warning banner if no payout info is set up
  - Direct link to open settings modal

**Status Badges:**
- Pending (Yellow) - ⏰ Clock icon
- Approved (Blue) - ✓ Check icon
- Processing (Purple) - 🔄 Refresh icon
- Paid (Green) - ✓ Check icon
- Rejected (Red) - ✗ X icon

### 2. Admin Payout Management (`frontend/src/pages/admin/AdminPayouts.tsx`)

**Features:**
- **Status Filter:**
  - Filter payouts by status
  - Refresh button to reload data

- **Summary Stats Cards:**
  - Count and total amount for each status
  - 5 cards: Pending, Approved, Processing, Paid, Rejected
  - Shows status badge, count, and total amount

- **Payouts Table:**
  - Lawyer name and email
  - Amount
  - Method & Account details (GCash number or Bank + account)
  - Request date
  - Status badge
  - Transaction reference
  - Action buttons based on status

- **Action Buttons:**
  - **Pending:** Approve or Reject buttons
  - **Approved/Processing:** Mark as Paid button
  - **Paid/Rejected:** No actions (final states)

- **Approve Modal:**
  - Shows lawyer details, amount, payout method, account
  - Warning note about manual transfer requirement
  - Confirm or Cancel

- **Mark as Paid Modal:**
  - Input for transaction reference (required)
  - Textarea for admin notes (optional)
  - Shows payout amount
  - Submit or Cancel

- **Reject Modal:**
  - Textarea for rejection reason (required)
  - Warning that lawyer will be notified
  - Shows payout amount
  - Submit or Cancel

### 3. API Services

#### lawyerApi.ts Updates:
```typescript
// Payouts - Update payout information
updatePayoutInfo(data: {
  gcash_number?: string;
  gcash_account_name?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  preferred_payout_method: 'gcash' | 'bank';
})

// Payouts - Request payout
requestPayout(amount: number)

// Payouts - Get payout history (cached 30 seconds)
getPayouts()
```

#### adminApi.ts Updates (adminPayoutService):
```typescript
// Get all payouts with optional filtering
getPayouts(status?: string, page: number = 1, perPage: number = 20)

// Get pending payouts
getPendingPayouts()

// Approve payout
approvePayout(id: number)

// Mark payout as paid
markAsPaid(id: number, data: {
  transaction_reference: string;
  admin_notes?: string;
})

// Reject payout
rejectPayout(id: number, data: {
  rejection_reason: string;
})
```

## Configuration

### Environment Variables
Add to `.env`:
```env
# Payout Configuration
PLATFORM_FEE_PERCENTAGE=20.00
MINIMUM_PAYOUT_AMOUNT=500.00
```

## Workflow

### Lawyer Workflow:
1. Complete appointments and receive payment from clients
2. Earnings automatically tracked (80% net after 20% platform fee)
3. View available balance in Earnings dashboard
4. Set up GCash or bank account information in Payout Settings
5. Request payout when balance ≥ ₱500
6. Wait for admin approval
7. Receive notification when payout is approved
8. Wait for manual transfer from admin
9. Receive notification when payout is marked as paid
10. View transaction reference in payout history

### Admin Workflow:
1. Monitor pending payout requests in Admin Payouts panel
2. Review lawyer details, amount, and payout information
3. **Approve** payout if everything checks out
4. Manually transfer funds via GCash or bank transfer
5. **Mark as Paid** with transaction reference
6. Add optional admin notes
7. OR **Reject** payout with reason if there's an issue

## Security Features
- All payout routes protected by authentication middleware
- Lawyer routes require `lawyer` middleware
- Admin routes require `admin` middleware
- Balance validation prevents over-withdrawal
- Minimum payout amount enforces ₱500 threshold
- Payout info validation before allowing requests
- Transaction references required for audit trail
- Admin notes for internal documentation
- Rejection reasons tracked for transparency

## Testing Checklist

### Database:
- [x] Migrations run successfully
- [ ] Test earning record creation on payment completion
- [ ] Test available balance calculation
- [ ] Test payout request with sufficient balance
- [ ] Test payout request with insufficient balance
- [ ] Test minimum amount validation (₱500)

### Lawyer Features:
- [ ] View earnings summary with correct calculations
- [ ] Update GCash payout information
- [ ] Update bank payout information
- [ ] Request payout with valid amount
- [ ] Request payout blocked without payout info
- [ ] View payout history with correct status

### Admin Features:
- [ ] View all pending payouts
- [ ] Filter payouts by status
- [ ] Approve payout request
- [ ] Mark payout as paid with reference
- [ ] Reject payout with reason
- [ ] View summary statistics

### API Endpoints:
- [ ] GET `/lawyer/earnings` returns correct data
- [ ] PUT `/lawyer/payout-info` updates successfully
- [ ] POST `/lawyer/payouts/request` creates payout
- [ ] GET `/lawyer/payouts` returns history
- [ ] GET `/admin/payouts/pending` returns pending
- [ ] POST `/admin/payouts/{id}/approve` approves payout
- [ ] POST `/admin/payouts/{id}/mark-paid` marks as paid
- [ ] POST `/admin/payouts/{id}/reject` rejects payout

### UI Components:
- [ ] Lawyer Earnings page loads and displays correctly
- [ ] Payout Settings modal works for GCash
- [ ] Payout Settings modal works for Bank
- [ ] Request Payout modal validates input
- [ ] Admin Payouts page loads and displays correctly
- [ ] Approve modal confirms approval
- [ ] Mark as Paid modal requires reference
- [ ] Reject modal requires reason

## Future Enhancements (Phase 2)

When the platform scales and generates significant revenue, consider upgrading to **PayMongo Platforms** for automated payment splitting:

### PayMongo Platforms Benefits:
- Automatic 80/20 split at payment time
- Direct deposit to lawyer's PayMongo account
- No manual transfers required
- Instant payouts to lawyers
- Lower operational overhead
- Better cash flow for lawyers

### Migration Path:
1. Contact PayMongo sales for Platforms access
2. Request lawyers to create PayMongo accounts
3. Link lawyer accounts to platform
4. Update payment flow to use split payments
5. Deprecate manual payout system
6. Archive existing payout records

## Summary
The Phase 1 Semi-Automated Manual Payout System provides:
- ✅ Automatic commission tracking (80/20 split)
- ✅ Lawyer self-service payout requests
- ✅ Admin approval workflow
- ✅ Manual transfer with audit trail
- ✅ Support for GCash and bank transfers
- ✅ Minimum payout threshold (₱500)
- ✅ Complete transaction history
- ✅ Status tracking and notifications
- ✅ Secure and validated workflows

This system allows the platform to launch quickly while maintaining full control over payouts and ensuring proper verification of all transfers.
