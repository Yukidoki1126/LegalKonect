# CORS Error Fix

## Problem
Images from R2 storage are being blocked by CORS policy:
```
Access to fetch at 'https://pub-c2fcfa5...r2.dev/system_logo/legalkonect.png' 
from origin 'http://www.legalkonect.site' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Quick Fix Applied
✅ Changed AdminDashboard logo to use local `/logo.png` instead of R2 URL

## Permanent Solution: Configure CORS on R2

### Step 1: Access R2 Bucket Settings
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2** → Your bucket
3. Click **Settings** tab

### Step 2: Add CORS Policy
Scroll to **CORS Policy** and add:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://legalkonect.site",
      "https://www.legalkonect.site",
      "http://www.legalkonect.site"
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

### Step 3: Save and Wait
- Click **Save**
- Wait 2-5 minutes for changes to propagate
- Clear browser cache
- Reload the page

## Files Currently Using R2 URLs

These files still reference R2 URLs and will need CORS configured:

1. `frontend/public/index.html` (favicon)
2. `frontend/src/components/Navigation.tsx` (logo)
3. `frontend/src/pages/Home.tsx` (logo)
4. `frontend/src/pages/Login.tsx` (logo)
5. `frontend/src/pages/Register.tsx` (logo)
6. `frontend/src/pages/LawyerRegister.tsx` (logo)
7. `frontend/src/pages/Privacy.tsx` (logo)
8. `frontend/src/pages/Terms.tsx` (logo)
9. `frontend/src/pages/lawyer/LawyerLayout.tsx` (logo)

## Alternative: Use Local Logo Everywhere

If you prefer to avoid R2 for logos, replace all R2 URLs with `/logo.png`:

```bash
# In PowerShell
Get-ChildItem -Path "frontend\src" -Recurse -Filter "*.tsx" | 
  ForEach-Object {
    (Get-Content $_.FullName) -replace 
      'https://pub-c2fcfa54c78d46cfbf87fcdba61cfbfe\.r2\.dev/system_logo/legalkonect\.png',
      '/logo.png' | 
    Set-Content $_.FullName
  }
```

## Verification

After configuring CORS:
1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Reload the page
4. CORS error should be gone
5. Images should load correctly

## Additional Resources

- Full R2 setup guide: `R2_SETUP_GUIDE.md`
- Cloudflare CORS docs: https://developers.cloudflare.com/r2/buckets/cors/
