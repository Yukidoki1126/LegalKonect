# Google Maps Blank Display Troubleshooting

## Issue
The Google Maps component loads successfully (no errors in console) but shows a blank/gray area instead of map tiles.

## Most Common Causes

### 1. Billing Not Enabled (MOST COMMON)
**Google Maps requires billing to be enabled even for free tier usage.**

**How to Fix:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **Billing** → **Link a billing account**
4. Add a credit/debit card
5. Google provides $200 free credit per month, so you won't be charged for normal development usage

**Note:** Without billing enabled, the API loads but map tiles won't render (this matches your exact symptom).

### 2. Required APIs Not Enabled
You need to enable these three APIs:

**How to Fix:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Library**
3. Search for and enable each of these:
   - **Maps JavaScript API** (for map display)
   - **Places API** (for address autocomplete)
   - **Geocoding API** (for coordinate ↔ address conversion)

### 3. API Key Restrictions
If your API key has restrictions, localhost might be blocked.

**How to Fix:**
1. Go to **APIs & Services** → **Credentials**
2. Click on your API key
3. Under **Application restrictions**:
   - Choose "None" for development (or)
   - Choose "HTTP referrers" and add:
     - `localhost:3000/*`
     - `127.0.0.1:3000/*`
     - `http://localhost:3000/*`
     - `http://127.0.0.1:3000/*`
4. Under **API restrictions**:
   - Choose "Restrict key"
   - Select only the 3 APIs mentioned above

## How to Diagnose

### Check Browser Console
Open Developer Tools (F12) and look at:

1. **Console Tab**: Look for any error messages containing:
   - "Google Maps JavaScript API error"
   - "RefererNotAllowedMapError"
   - "ApiNotActivatedMapError"
   - "BillingNotEnabledMapError"

2. **Network Tab**:
   - Filter by "maps"
   - Look for failed requests (red status codes)
   - Check if tiles are loading (look for requests to `khms` or `tile` URLs)

### Check API Status
```bash
# Make a test request to verify API key
curl "https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY"
```

If billing is not enabled, you'll see an error in the response.

## Current API Key
Your API key: `AIzaSyCEf6bsPF8bKN6DYLdKWyrO774mF0kqqTg`

## Testing Steps

After making changes in Google Cloud Console:

1. **Clear browser cache** - Old API responses might be cached
2. **Hard refresh** - Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
3. **Restart dev server**:
   ```bash
   cd frontend
   npm start
   ```
4. **Test the map** - Navigate to `/lawyer/profile`

## Expected Behavior After Fix

Once billing is enabled and APIs are activated:
- Map tiles should load within 2-3 seconds
- You should see streets, labels, and terrain
- Clicking the map should drop a marker
- Search should show autocomplete suggestions
- "Use Current Location" should zoom to your location

## Alternative Test

To confirm the API key works, create a simple HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Map Test</title>
  <style>
    #map { height: 400px; width: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    function initMap() {
      new google.maps.Map(document.getElementById('map'), {
        center: { lat: 14.5995, lng: 120.9842 },
        zoom: 15
      });
    }
  </script>
  <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCEf6bsPF8bKN6DYLdKWyrO774mF0kqqTg&callback=initMap"></script>
</body>
</html>
```

Open this file in a browser. If the map still doesn't show, the issue is definitely with the API key configuration, not your React code.

## Code Changes Made

I've already updated [LocationPickerWithMap.tsx](frontend/src/components/LocationPickerWithMap.tsx) with:
- Added `preventGoogleFontsLoading: true` to reduce external dependencies
- Removed debug console logs
- Simplified the map container structure
- Removed conditional rendering that might delay map initialization

## Support Resources

- [Google Maps Platform FAQ](https://developers.google.com/maps/faq)
- [Billing Guide](https://developers.google.com/maps/billing-and-pricing/billing)
- [Common Errors](https://developers.google.com/maps/documentation/javascript/error-messages)

## Quick Checklist

- [ ] Billing enabled on Google Cloud project
- [ ] Maps JavaScript API enabled
- [ ] Places API enabled
- [ ] Geocoding API enabled
- [ ] API key has no restrictions (or localhost whitelisted)
- [ ] Browser cache cleared
- [ ] Dev server restarted
- [ ] Hard refresh performed

**Most users find that enabling billing solves the blank map issue immediately.**
