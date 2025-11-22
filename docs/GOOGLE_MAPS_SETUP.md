# Google Maps API Setup for LegalKonect

## Overview
The lawyer profile settings now include an interactive Google Maps integration that allows lawyers to:
- Search for their office location
- Use their current location
- Click on the map to pin their exact office location
- Get directions link for clients

## Installation

### 1. Install Required Package

```bash
cd frontend
npm install @react-google-maps/api
```

### 2. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Go to "Credentials" and create an API key
5. (Optional but recommended) Restrict the API key:
   - Application restrictions: HTTP referrers
   - Add your domain (e.g., `localhost:3000/*` for development)
   - API restrictions: Select the three APIs mentioned above

### 3. Add API Key to Environment Variables

Create or update `frontend/.env` file:

```env
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**Important:** Never commit the `.env` file to version control!

### 4. Restart Development Server

After adding the environment variable, restart your React development server:

```bash
npm start
```

## Features

### Lawyer Profile Settings
- **Interactive Map**: Full map view where lawyers can see and select their office location
- **Search Autocomplete**: Search for addresses with Google Places autocomplete
- **Current Location**: One-click button to use device's current location
- **Click to Pin**: Click anywhere on the map to set the exact office location
- **Reverse Geocoding**: Automatically gets the address when clicking on the map
- **Coordinates Display**: Shows latitude and longitude for the selected location
- **Get Directions**: Link that opens Google Maps with directions to the office

### Backend Updates Required

Update the `lawyers` table migration to include latitude and longitude:

```php
// In your migration file
$table->decimal('office_latitude', 10, 8)->nullable();
$table->decimal('office_longitude', 11, 8)->nullable();
```

Run the migration:

```bash
cd backend
php artisan migrate
```

Update the `Lawyer` model's `$fillable` array:

```php
protected $fillable = [
    // ... existing fields
    'office_latitude',
    'office_longitude',
];
```

Update the `$casts` array:

```php
protected $casts = [
    // ... existing casts
    'office_latitude' => 'decimal:8',
    'office_longitude' => 'decimal:8',
];
```

## Component Structure

### LocationPickerWithMap Component
Location: `frontend/src/components/LocationPickerWithMap.tsx`

**Props:**
- `initialLat?: number` - Initial latitude for the map center
- `initialLng?: number` - Initial longitude for the map center
- `initialAddress?: string` - Pre-filled address in the search box
- `onLocationChange: (lat: number, lng: number, address: string) => void` - Callback when location changes

**Features:**
- Search box with Google Places autocomplete
- "Use Current Location" button
- Interactive map with draggable marker
- Click-to-pin functionality
- Address display with coordinates
- Get directions link
- Loading and error states
- Helpful instructions

## Usage Example

```tsx
import LocationPickerWithMap from '../components/LocationPickerWithMap';

<LocationPickerWithMap
  initialLat={14.5995}
  initialLng={120.9842}
  initialAddress="Manila, Philippines"
  onLocationChange={(lat, lng, address) => {
    console.log('New location:', { lat, lng, address });
    // Update your form data here
  }}
/>
```

## Troubleshooting

### Map Not Loading
- Check if `REACT_APP_GOOGLE_MAPS_API_KEY` is set in `.env`
- Verify the API key is valid
- Check if Maps JavaScript API is enabled in Google Cloud Console
- Check browser console for errors

### Autocomplete Not Working
- Ensure Places API is enabled
- Check API key restrictions

### Geocoding Errors
- Ensure Geocoding API is enabled
- Check if you've exceeded the free tier quota

## API Costs

Google Maps offers a generous free tier:
- **Maps JavaScript API**: $200 free credit per month (28,000 map loads)
- **Places API**: $200 free credit per month (varies by request type)
- **Geocoding API**: $200 free credit per month (40,000 requests)

Monitor usage in the Google Cloud Console to avoid unexpected charges.

## Security Best Practices

1. **Never expose your API key in client-side code** - Use environment variables
2. **Restrict your API key** - Set HTTP referrer restrictions and API restrictions
3. **Monitor usage** - Set up budget alerts in Google Cloud Console
4. **Rotate keys periodically** - Change API keys regularly for security
5. **Use separate keys** - Different keys for development and production

## Testing

To test the map functionality:

1. Navigate to lawyer profile settings: `/lawyer/profile`
2. Scroll to the "Office Address" section
3. Try each method:
   - Search for an address
   - Click "Use Current Location"
   - Click anywhere on the map
4. Verify the selected address displays correctly
5. Save the profile and reload to ensure data persists

## Future Enhancements

Potential improvements:
- Add a "View on Google Maps" button for clients
- Show lawyer office locations on a map in search results
- Distance calculation from user to lawyer office
- Multiple office locations support
- Street view integration
- Custom map markers with lawyer branding
