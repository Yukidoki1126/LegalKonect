# Google Calendar Integration Setup Guide

This guide explains how to set up Google Calendar integration for your LegalKonect application.

## Overview

The Google Calendar integration allows lawyers to:
- Automatically sync appointments to their Google Calendar
- Receive email reminders from Google
- View appointments on any device with Google Calendar
- Manage everything from one familiar calendar interface

## Prerequisites

- A Google Cloud Platform account
- Access to the Google Cloud Console
- Your Laravel backend running on `http://localhost:8000`
- Your React frontend running on `http://localhost:5173`

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `LegalKonect` (or your preferred name)
4. Click "Create"

## Step 2: Enable Google Calendar API

1. In the Google Cloud Console, select your project
2. Go to "APIs & Services" → "Library"
3. Search for "Google Calendar API"
4. Click on it and press "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" (or "Internal" if you have a Google Workspace)
3. Click "Create"
4. Fill in the required information:
   - **App name**: LegalKonect
   - **User support email**: Your email
   - **App logo**: (Optional) Upload your logo
   - **Application home page**: `http://localhost:5173` (or your production URL)
   - **Authorized domains**: Add your domain (for production)
   - **Developer contact information**: Your email
5. Click "Save and Continue"
6. **Scopes**: Click "Add or Remove Scopes"
   - Search and add:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
   - Click "Update" then "Save and Continue"
7. **Test users** (for testing): Add email addresses of users who will test
8. Click "Save and Continue"
9. Review and click "Back to Dashboard"

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Name: `LegalKonect Web Client`
5. **Authorized JavaScript origins**:
   - Add: `http://localhost:8000`
   - (For production, add your production backend URL)
6. **Authorized redirect URIs**:
   - Add: `http://localhost:8000/api/google/callback`
   - (For production, add: `https://yourdomain.com/api/google/callback`)
7. Click "Create"
8. **Important**: Copy your:
   - Client ID
   - Client Secret

## Step 5: Configure Backend Environment

1. Open `backend/.env`
2. Add the following variables:

```env
# Google Calendar API
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:8000/api/google/callback
```

3. Replace `your-client-id-here` and `your-client-secret-here` with the values from Step 4

## Step 6: Test the Integration

1. Start your backend server:
   ```bash
   cd backend
   php artisan serve
   ```

2. Start your frontend server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Log in as a lawyer account
4. Navigate to "Google Calendar" in the lawyer dashboard sidebar
5. Click "Connect Google Calendar"
6. You'll be redirected to Google to authorize access
7. After authorization, you'll be redirected back to the app
8. The status should show "Connected"

## Step 7: Verify Syncing

1. As a client, book an appointment with the connected lawyer
2. Check the lawyer's Google Calendar
3. The appointment should appear automatically as a calendar event

## Features

Once connected, the integration provides:

### Automatic Event Creation
- When a client books an appointment, it's automatically added to the lawyer's Google Calendar
- Event includes:
  - Client name
  - Client email
  - Meeting type (in-person, video, phone)
  - Client notes
  - Duration (1 hour)

### Smart Reminders
- Email reminder 24 hours before appointment
- Pop-up reminder 1 hour before appointment

### Event Updates
- When appointment status changes, the calendar event is updated
- Cancellations are reflected in Google Calendar

## Production Deployment

When deploying to production:

1. Update OAuth consent screen with production URLs
2. Update authorized redirect URIs in Google Cloud Console
3. Update `.env` variables:
   ```env
   GOOGLE_REDIRECT_URI=https://yourdomain.com/api/google/callback
   ```
4. If using a custom domain, add it to "Authorized domains" in OAuth consent screen
5. Consider publishing your OAuth consent screen (requires Google verification for public apps)

## Troubleshooting

### "redirect_uri_mismatch" Error
- Make sure the redirect URI in your code exactly matches the one in Google Cloud Console
- Check for trailing slashes, http vs https, and port numbers

### "Access blocked: This app's request is invalid"
- Make sure you've added test users in the OAuth consent screen
- Or publish your app (requires verification)

### Token Expired
- The system automatically refreshes tokens
- If issues persist, disconnect and reconnect Google Calendar

### Events Not Syncing
- Check backend logs: `storage/logs/laravel.log`
- Verify the lawyer has `google_calendar_connected` = true in database
- Test API endpoints manually

## API Endpoints

### Get Auth URL
```
GET /api/lawyer/google/auth-url
Authorization: Bearer {token}
```

### Get Connection Status
```
GET /api/lawyer/google/status
Authorization: Bearer {token}
```

### Disconnect
```
POST /api/lawyer/google/disconnect
Authorization: Bearer {token}
```

### OAuth Callback (Public)
```
GET /api/google/callback?code={authorization_code}
```

## Database Schema

The integration uses these fields in the `lawyers` table:
- `google_access_token` (text, nullable) - Encrypted access token
- `google_refresh_token` (text, nullable) - Refresh token for obtaining new access tokens
- `google_token_expires_at` (timestamp, nullable) - Token expiration timestamp
- `google_calendar_id` (string, nullable) - Calendar ID (defaults to 'primary')
- `google_calendar_connected` (boolean, default: false) - Connection status

And in the `appointments` table:
- `google_event_id` (string, nullable) - Google Calendar event ID for syncing

## Security Notes

- Access tokens are stored encrypted in the database
- Refresh tokens allow automatic token renewal without user intervention
- Tokens are only accessible to the lawyer who owns them
- OAuth scopes are limited to calendar read/write only
- All API endpoints require authentication

## Support

If you encounter issues:
1. Check the Laravel logs: `backend/storage/logs/laravel.log`
2. Check browser console for frontend errors
3. Verify Google Cloud Console configuration
4. Test with a different Google account
5. Contact support at support@legalkonect.com

## Additional Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Laravel Documentation](https://laravel.com/docs)
