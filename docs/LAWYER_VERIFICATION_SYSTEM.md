# Lawyer Verification System

## Overview

The Lawyer Verification System allows lawyers to register with document uploads (IBP card, PRC license, government ID) and credentials. Admin users can then manually review and approve/reject these applications.

## Backend Implementation

### 1. Database Changes

**Migration**: `2025_11_13_162715_add_verification_fields_to_lawyers_table.php`

Added the following fields to the `lawyers` table:
- `verification_status` - ENUM('pending', 'verified', 'rejected') DEFAULT 'pending'
- `ibp_number` - VARCHAR(50) - Integrated Bar of the Philippines number
- `roll_of_attorneys_number` - VARCHAR(50) - Supreme Court Roll of Attorneys number
- `prc_license_number` - VARCHAR(50) - Professional Regulation Commission license
- `verification_documents` - JSON - Stores file paths for uploaded documents
- `verification_notes` - TEXT - Admin notes about verification decision
- `verified_at` - TIMESTAMP - When verification was completed
- `verified_by` - Foreign key to `users` table (admin who verified)

### 2. Model Updates

**File**: `backend/app/Models/Lawyer.php`

Added:
- New fillable fields for verification
- Relationship: `verifiedBy()` - Links to admin User who verified
- Scopes:
  - `verified()` - Get only verified lawyers
  - `pendingVerification()` - Get lawyers awaiting verification
- Helper methods:
  - `isVerified()` - Check if lawyer is verified
  - `isPendingVerification()` - Check if pending
  - `isRejected()` - Check if rejected

### 3. Services

**File**: `backend/app/Services/LawyerVerificationService.php`

Handles:
- **Document Upload**: Uploads files to `storage/app/private/lawyer_documents/{lawyer_id}/`
- **Document Deletion**: Removes old documents when needed
- **Temporary URLs**: Generates time-limited URLs for viewing documents
- **Verification Status Updates**: Approve/reject lawyers with admin notes
- **Query Methods**: Get pending verifications and all lawyers with filters

**Storage Configuration**: Added `private` disk in `config/filesystems.php`
```php
'private' => [
    'driver' => 'local',
    'root' => storage_path('app/private'),
    'serve' => true,
],
```

### 4. Controllers

#### LawyerController Updates
**File**: `backend/app/Http/Controllers/LawyerController.php`

Updated `createProfile()` method to accept:
- Verification credentials: `ibp_number`, `roll_of_attorneys_number`, `prc_license_number`
- Document uploads (max 5MB each):
  - `ibp_card` - Required (IBP card image/PDF)
  - `government_id` - Required (Valid government ID)
  - `prc_license` - Optional (PRC license image/PDF)
  - `good_standing_cert` - Optional (Certificate of Good Standing)

On successful upload, sets `verification_status` to 'pending'

#### AdminVerificationController
**File**: `backend/app/Http/Controllers/AdminVerificationController.php`

API endpoints for admin verification:
- `GET /api/admin/verifications/pending` - Get pending verifications
- `GET /api/admin/verifications/lawyers` - Get all lawyers (with optional status filter)
- `GET /api/admin/verifications/lawyers/{id}` - Get lawyer details with document URLs
- `POST /api/admin/verifications/lawyers/{id}/approve` - Approve lawyer
- `POST /api/admin/verifications/lawyers/{id}/reject` - Reject lawyer (requires notes)
- `GET /api/admin/verifications/lawyers/{id}/documents/{type}` - Download document

### 5. API Routes

**File**: `backend/routes/api.php`

Added routes under `admin` middleware group (lines 231-237)

## Workflow

### Lawyer Registration Flow

1. **User creates account** - Standard registration
2. **User creates lawyer profile** - Fills out form with:
   - Personal info (name, bio, experience)
   - Office details (address, phone, location)
   - Specializations
   - Credentials (IBP number, PRC license number)
   - Document uploads (IBP card, government ID, etc.)
3. **Profile created with status** - `verification_status: 'pending'`, `status: 'pending'`
4. **Documents uploaded** - Stored in private storage
5. **Admin reviews** - Views documents and credentials
6. **Admin decision**:
   - **Approve**: Sets `verification_status: 'verified'` and `status: 'approved'`
   - **Reject**: Sets `verification_status: 'rejected'` and `status: 'rejected'` with notes

### Admin Verification Flow

1. **Admin logs in** - Uses admin credentials
2. **Views pending verifications** - Dashboard shows list of pending lawyers
3. **Reviews lawyer details** - Views credentials and downloads documents
4. **Verifies credentials** - Manually checks:
   - IBP number against Supreme Court records
   - PRC license validity
   - Government ID authenticity
   - Certificate of Good Standing (if provided)
5. **Makes decision**:
   - **Approve**: Lawyer can now accept appointments
   - **Reject**: Provides reason in notes

## Frontend Implementation (Pending)

### TODO: Lawyer Registration Form Updates
- Add file upload fields for documents
- Add credential input fields (IBP number, PRC license)
- Display file upload progress
- Show validation errors for file size/type
- Display success message with pending status

### TODO: Admin Verification Dashboard
- Create admin page to view pending verifications
- Display lawyer details (name, credentials, specializations)
- Show document previews/download links
- Add approve/reject buttons
- Form for rejection notes
- Filter by verification status (pending/verified/rejected)

### TODO: Verification Status Badge
- Display badge on lawyer profiles
- Show verification status in lawyer dashboard
- Display pending status message to newly registered lawyers

## Security Considerations

1. **Private Storage**: Documents stored in `storage/app/private/`, not publicly accessible
2. **Temporary URLs**: Document URLs expire after 1 hour
3. **Admin Authorization**: Only users with `role: 'admin'` can verify
4. **File Validation**: Max 5MB, only images and PDFs allowed
5. **Audit Trail**: Tracks who verified and when

## Future Enhancements

- [ ] Email notifications when verification status changes
- [ ] Automated IBP number verification (if API becomes available)
- [ ] Document expiration tracking (e.g., Good Standing cert expires yearly)
- [ ] Multi-step verification process
- [ ] Lawyer re-verification requirements (annual)
- [ ] Admin audit log of all verification actions

## Testing

### Manual Testing Checklist

**Lawyer Registration**:
- [ ] Can upload IBP card (image and PDF)
- [ ] Can upload government ID
- [ ] Can upload optional documents
- [ ] File size validation works (max 5MB)
- [ ] File type validation works (only jpg, jpeg, png, pdf)
- [ ] IBP number is required
- [ ] Profile created with pending status

**Admin Verification**:
- [ ] Admin can view pending verifications
- [ ] Admin can view lawyer details
- [ ] Admin can download documents
- [ ] Admin can approve lawyer
- [ ] Admin can reject lawyer (with notes required)
- [ ] Verification updates lawyer status
- [ ] Non-admin users cannot access verification endpoints

## Database Queries

```sql
-- Get all pending verifications
SELECT * FROM lawyers WHERE verification_status = 'pending';

-- Get all verified lawyers
SELECT * FROM lawyers WHERE verification_status = 'verified';

-- Get verification statistics
SELECT
    verification_status,
    COUNT(*) as count
FROM lawyers
GROUP BY verification_status;

-- Get lawyers verified by specific admin
SELECT l.*, u.name as admin_name
FROM lawyers l
JOIN users u ON l.verified_by = u.id
WHERE l.verified_by = 1;
```

## File Structure

```
backend/
├── app/
│   ├── Http/Controllers/
│   │   ├── AdminVerificationController.php (NEW)
│   │   └── LawyerController.php (UPDATED)
│   ├── Models/
│   │   └── Lawyer.php (UPDATED)
│   └── Services/
│       └── LawyerVerificationService.php (NEW)
├── config/
│   └── filesystems.php (UPDATED)
├── database/migrations/
│   └── 2025_11_13_162715_add_verification_fields_to_lawyers_table.php (NEW)
├── routes/
│   └── api.php (UPDATED)
└── storage/app/
    └── private/
        └── lawyer_documents/
            └── {lawyer_id}/
                ├── ibp_card_xxx.jpg
                ├── government_id_xxx.jpg
                ├── prc_license_xxx.pdf
                └── good_standing_cert_xxx.pdf
```

---

*Last updated: November 14, 2025*
