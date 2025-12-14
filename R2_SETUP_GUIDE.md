# Cloudflare R2 Setup Guide for LegalKonect

This guide explains how to set up Cloudflare R2 storage for persistent file storage in production.

## Why R2?

- ✅ **Zero Egress Fees** - No charges for downloads/bandwidth
- ✅ **Cheaper Storage** - $0.015/GB vs S3's $0.023/GB
- ✅ **10GB Free** - Free storage tier included
- ✅ **S3 Compatible** - Works with existing AWS S3 libraries
- ✅ **Global CDN** - Fast file delivery worldwide

## Files Stored in R2

1. **Lawyer Profile Photos** - Displayed in search results
2. **Client Profile Pictures** - User avatars
3. **GCash QR Codes** - Payment QR codes for manual payments
4. **Verification Documents** - Encrypted lawyer credentials (IBP card, licenses, etc.)
5. **Payment Proof Receipts** - Client payment screenshots

## Step 1: Create Cloudflare R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2** in the left sidebar
3. Click **Create Bucket**
4. Choose a bucket name (e.g., `legalkonect-production`)
5. Select a location (or use **Automatic** for best performance)
6. Click **Create Bucket**

## Step 2: Generate R2 API Tokens

1. In R2 dashboard, click **Manage R2 API Tokens**
2. Click **Create API Token**
3. Configure:
   - **Token Name**: `legalkonect-api-token`
   - **Permissions**: `Object Read & Write`
   - **Buckets**: Select your bucket or choose `All buckets`
4. Click **Create API Token**
5. **IMPORTANT**: Copy and save these values immediately (they won't be shown again):
   - Access Key ID
   - Secret Access Key
   - Endpoint URL

## Step 3: Set Up R2 Public Domain (for file access)

1. Go to your R2 bucket settings
2. Click **Settings** tab
3. Under **Public Access**, click **Connect Domain**
4. Options:
   - **Option A**: Use Cloudflare subdomain (e.g., `pub-xxxxx.r2.dev`)
   - **Option B**: Connect custom domain (e.g., `cdn.legalkonect.com`)
5. Copy the public URL

## Step 4: Configure CORS (Important!)

To allow your frontend to load images from R2, you need to configure CORS:

1. In your R2 bucket, go to **Settings** tab
2. Scroll to **CORS Policy** section
3. Click **Add CORS Policy** or **Edit**
4. Add this configuration:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://legalkonect.site",
      "https://www.legalkonect.site"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3600
  }
]
```

5. Click **Save**

**Important Notes:**
- Add your actual production domain(s) to `AllowedOrigins`
- Include both `www` and non-`www` versions
- Include localhost for development
- `GET` and `HEAD` methods are needed for image loading
- Without CORS, browsers will block image loading with "CORS error"

## Step 5: Configure Environment Variables on Render

Add these environment variables to your Render service:

```env
# Set filesystem to use R2
FILESYSTEM_DISK=r2

# R2 Credentials
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET=legalkonect-production
R2_ENDPOINT=https://xxxxx.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
R2_REGION=auto
```

### How to Add on Render:

1. Go to your Render service dashboard
2. Click **Environment** in the left sidebar
3. Click **Add Environment Variable**
4. Add each variable above with your actual values
5. Click **Save Changes**
6. Render will automatically redeploy

## Step 6: Test the Integration

After deployment, test file uploads:

### Test 1: Lawyer Profile Photo
1. Log in as a lawyer
2. Go to **Profile Settings**
3. Upload a profile photo
4. Check if photo displays correctly

### Test 2: GCash QR Code
1. As a lawyer, go to **Payment Methods**
2. Upload a GCash QR code
3. Book an appointment as a client
4. Verify QR code displays in payment screen

### Test 3: Client Profile Picture
1. Log in as a client
2. Upload profile picture
3. Check if it displays in appointments

## Step 7: Migrate Existing Files (Optional)

If you already have files in local storage, you'll need to re-upload them or migrate:

### Manual Re-upload
1. Lawyers: Re-upload profile photos via Profile Settings
2. Lawyers: Re-upload GCash QR codes via Payment Methods
3. Clients: Re-upload profile pictures via Settings

### Programmatic Migration (Advanced)
```php
// In Laravel tinker or custom command
$lawyers = Lawyer::whereNotNull('profile_photo')->get();
foreach ($lawyers as $lawyer) {
    // Copy from local storage to R2
    $localPath = storage_path('app/public/' . $lawyer->profile_photo);
    if (file_exists($localPath)) {
        $contents = file_get_contents($localPath);
        Storage::disk('r2')->put($lawyer->profile_photo, $contents);
    }
}
```

## Troubleshooting

### CORS Error / Images Not Loading

**Problem**: Console shows "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution**:
1. Go to R2 bucket **Settings** → **CORS Policy**
2. Add your domain to `AllowedOrigins`
3. Include both `http://` and `https://` versions
4. Include `www` and non-`www` versions
5. Wait a few minutes for changes to propagate
6. Clear browser cache and reload

### Files Not Displaying

**Problem**: Images show broken/404 error

**Solution**:
1. Check R2_PUBLIC_URL is correct
2. Verify bucket has public access enabled
3. Check file paths in database match uploaded files
4. Verify CORS is configured (see above)

### Upload Fails

**Problem**: File upload returns 500 error

**Solution**:
1. Verify R2 credentials are correct
2. Check R2_ENDPOINT URL is correct
3. Ensure API token has write permissions
4. Check Laravel logs: `backend/storage/logs/laravel.log`

### Wrong Storage Disk

**Problem**: Files still going to local storage

**Solution**:
1. Verify `FILESYSTEM_DISK=r2` in environment variables
2. Clear config cache: `php artisan config:clear`
3. Restart Render service

## Cost Estimate

### Free Tier (Monthly):
- **Storage**: 10 GB
- **Class A Operations**: 1 million (writes, lists)
- **Class B Operations**: 10 million (reads)

### Estimated Usage for LegalKonect:
- **100 lawyers** with photos (5MB each) = 500 MB
- **1,000 clients** with photos (2MB each) = 2 GB
- **500 appointments/month** = minimal operations

**Monthly Cost**: $0 (within free tier)

### Paid Pricing (if exceeding free tier):
- **Storage**: $0.015/GB/month
- **Class A Operations**: $4.50 per million
- **Class B Operations**: $0.36 per million
- **Egress**: $0 (FREE!)

## Benefits Summary

✅ **Persistent Storage** - Files survive restarts/redeployments
✅ **No Bandwidth Costs** - Unlimited downloads at no charge
✅ **Better Performance** - Global CDN for fast delivery
✅ **Scalable** - Handles unlimited files
✅ **Professional** - No broken images in production
✅ **Cost-Effective** - Cheaper than S3 with zero egress fees

## Next Steps

1. Set up your R2 bucket
2. Add environment variables to Render
3. Redeploy your application
4. Test file uploads
5. Monitor R2 usage in Cloudflare dashboard

For questions or issues, refer to:
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [Laravel Filesystem Docs](https://laravel.com/docs/filesystem)
