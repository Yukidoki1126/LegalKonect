# Fix R2 CORS Errors for Profile Pictures

## Problem
Profile pictures are failing to load with CORS error:
```
Access to image at 'https://pub-c2fcfa5...r2.dev/...' from origin 'https://www.legalkonect.site' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present.
```

## Solution: Configure R2 Bucket CORS

### Step 1: Access Cloudflare Dashboard
1. Go to https://dash.cloudflare.com
2. Navigate to **R2** in the left sidebar
3. Click on your bucket (the one with domain `pub-c2fcfa5...r2.dev`)

### Step 2: Configure CORS Policy
1. Click on the **Settings** tab
2. Scroll to **CORS Policy** section
3. Click **Add CORS policy** or **Edit CORS policy**
4. Add the following configuration:

```json
[
  {
    "AllowedOrigins": [
      "https://www.legalkonect.site",
      "https://legalkonect.site",
      "https://api.legalkonect.site",
      "http://localhost:3000",
      "http://localhost:5173"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD",
      "PUT",
      "POST"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

### Step 3: Save and Wait
- Click **Save**
- Wait 1-2 minutes for the changes to propagate
- Hard refresh your browser (Ctrl + Shift + R)

## Alternative: Use R2 Custom Domain with Cloudflare Proxy

If CORS continues to be an issue, you can set up a custom domain for R2 that routes through Cloudflare's proxy, which handles CORS automatically:

1. In R2 bucket settings, click **Connect Domain**
2. Add a subdomain like `cdn.legalkonect.site`
3. Cloudflare will automatically create a CNAME record
4. Update your backend `.env` to use the custom domain:
   ```
   R2_PUBLIC_URL=https://cdn.legalkonect.site
   ```

## Verification

After applying CORS settings:
1. Open DevTools Console (F12)
2. Refresh the page
3. Profile pictures should load without CORS errors
4. You should see successful image loads in the Network tab

## Current Issue
Your frontend expects images at:
- `https://api.legalkonect.site/storage/...`

But images are actually at:
- `https://pub-c2fcfa5...r2.dev/...`

This mismatch suggests either:
1. Backend is not returning the correct R2 URLs
2. R2_PUBLIC_URL is not configured in backend `.env`

Check your backend `.env` file and ensure:
```env
R2_PUBLIC_URL=https://pub-c2fcfa5...r2.dev
R2_BUCKET=your-bucket-name
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
```
