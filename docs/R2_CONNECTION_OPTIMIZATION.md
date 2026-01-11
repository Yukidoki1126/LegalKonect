# R2 Storage Connection Optimizations

## Overview
This document outlines the optimizations implemented for Cloudflare R2 storage connections to improve reliability, performance, and user experience.

## Backend Optimizations (Laravel)

### 1. Filesystem Configuration (`config/filesystems.php`)

**Connection Timeouts:**
- `connect_timeout`: 5 seconds - Fast connection establishment
- `timeout`: 15 seconds - Request timeout to prevent hanging
- Connection pooling enabled via Guzzle HTTP client

**Benefits:**
- Faster connection establishment
- Prevents indefinite waiting
- Reuses TCP connections for better performance
- Handles network issues gracefully

### 2. R2StorageService (`app/Services/R2StorageService.php`)

**Features:**
- Automatic retry logic with exponential backoff (3 attempts: 1s, 2s, 4s delays)
- Comprehensive error logging for debugging
- Graceful fallbacks for URL generation
- Safe file operations with existence checks

**Methods:**
- `uploadFile()` - Upload with retry
- `uploadContent()` - Content upload with retry
- `deleteFile()` - Safe deletion with retry
- `getUrl()` - URL generation with fallback
- `exists()`, `getSize()`, `copy()`, `move()` - File operations

**Usage Example:**
```php
use App\Services\R2StorageService;

$r2Service = new R2StorageService();

// Upload file with automatic retry
$path = $r2Service->uploadFile($file, 'profile/photo.jpg');

// Get URL with fallback
$url = $r2Service->getUrl($path);

// Delete with retry
$r2Service->deleteFile($path);
```

## Frontend Optimizations (React/TypeScript)

### 1. API Configuration (`services/api.ts`)

**Updated Settings:**
- `timeout`: 30 seconds (increased from 10s for R2 operations)
- `maxRedirects`: 5 - Handle CDN redirects
- Better error handling - doesn't reject on 4xx errors

### 2. R2StorageService (`services/r2StorageService.ts`)

**Features:**
- Image preloading with retry logic
- In-memory caching to avoid duplicate requests
- Promise deduplication (prevents loading same image twice)
- Exponential backoff retry (3 attempts)
- Batch preloading for multiple images
- File download helper

**Methods:**
- `getUrl()` - Convert path to full URL
- `preloadImage()` - Preload with retry and caching
- `preloadImages()` - Batch preload
- `prefetch()` - Background preloading
- `downloadFile()` - Download from R2
- `clearCache()` - Cache management

**Usage Example:**
```typescript
import { r2StorageService, getR2Url } from '../services/r2StorageService';

// Simple URL conversion
const url = getR2Url('/profile/photo.jpg');

// Preload with retry
const loadedUrl = await r2StorageService.preloadImage('/profile/photo.jpg', {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 10000
});

// Prefetch multiple images in background
r2StorageService.prefetch([
  '/profile/photo1.jpg',
  '/profile/photo2.jpg',
  '/profile/photo3.jpg'
]);
```

### 3. OptimizedImage Component (`components/OptimizedImage.tsx`)

**Features:**
- Automatic retry on load failure
- Loading states with progress indication
- 10-second timeout per attempt
- Manual retry button
- Graceful fallback UI
- Cache busting on retry

**Usage Example:**
```tsx
<OptimizedImage
  src={imageUrl}
  alt="Receipt"
  className="w-full h-auto"
  fallbackText="Image unavailable"
  retryAttempts={3}
  retryDelay={2000}
/>
```

## Payment Receipt Modal Optimizations

### Implemented in `LawyerAppointments.tsx`:

1. **Loading States:**
   - Shows spinner while fetching receipt
   - Displays retry count
   - Clear error messages

2. **Retry Logic:**
   - Automatic 3 attempts with exponential backoff
   - 15-second timeout per attempt
   - Manual retry button
   - Network error detection

3. **Error Handling:**
   - Offline detection
   - Network vs server error differentiation
   - User-friendly error messages
   - Non-blocking (modal stays open)

4. **URL Construction:**
   - Proper path handling
   - R2 public URL integration
   - Fallback mechanisms

## Lawyer Search Optimizations

### Implemented in `LawyerSearch.tsx`:

1. **Network Resilience:**
   - Automatic retry (3 attempts)
   - Exponential backoff
   - 10-second timeout per request
   - Online/offline detection

2. **Cache Strategy:**
   - Uses cached data when API fails
   - Shows warning when using stale data
   - Auto-refresh when connection restored

3. **Error Messages:**
   - Network-specific messages
   - Server error handling
   - Retry count display

## Notification Service Optimizations

### Implemented in `services/notificationService.ts`:

1. **Faster Polling:**
   - 3-second interval (was 5s)
   - 15-second inactive interval (was 30s)

2. **Better Responsiveness:**
   - Window focus detection
   - Immediate check on focus
   - Concurrency protection

3. **Retry Logic:**
   - Exponential backoff on errors
   - Up to 3 retry attempts
   - Error recovery

## Configuration Recommendations

### Environment Variables (.env):

```env
# R2 Storage Configuration
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET=your_bucket_name
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://your-custom-domain.com
R2_REGION=auto

# Use R2 for file storage
FILESYSTEM_DISK=r2
```

### R2 Domain Setup (Optional but Recommended):

1. **Custom Domain:**
   - Set up custom domain in Cloudflare R2
   - Enables R2's CDN caching
   - Better performance globally

2. **Cache Headers:**
   - R2 automatically caches files
   - Can configure cache TTL
   - Reduces origin requests

## Performance Benefits

1. **Connection Pooling:**
   - Reuses TCP connections
   - Reduces connection overhead
   - Faster subsequent requests

2. **Retry Logic:**
   - Handles transient failures
   - Exponential backoff prevents server overload
   - Better success rate

3. **Caching:**
   - Frontend image cache
   - Reduces duplicate requests
   - Faster perceived performance

4. **Timeouts:**
   - Prevents indefinite hanging
   - Better error detection
   - Improved user experience

5. **Error Handling:**
   - Graceful degradation
   - Clear user feedback
   - Non-blocking UI

## Monitoring and Debugging

### Frontend Console Logs:
- `🌐 API REQUEST` - API calls
- `📡 Fetching lawyers from API...` - Data fetching
- `✅ Data fetched and cached` - Success
- `Loading payment proof (attempt X/3)...` - Retries
- `Payment proof loaded successfully` - Success

### Backend Logs:
```php
Log::info('R2 upload attempt 1/3', ['path' => $path]);
Log::warning('R2 upload attempt 1 failed', ['error' => $e->getMessage()]);
Log::error('R2 upload failed after all retries', ['path' => $path]);
```

## Testing Recommendations

1. **Network Conditions:**
   - Test with slow 3G
   - Test with intermittent connection
   - Test with complete offline

2. **Large Files:**
   - Test upload timeouts
   - Test retry on large images
   - Verify progress indicators

3. **Error Scenarios:**
   - Invalid URLs
   - Missing files
   - Server errors
   - Network timeouts

## Future Enhancements

1. **Progressive Image Loading:**
   - Thumbnail → Full image
   - Better perceived performance

2. **Service Worker:**
   - Offline caching
   - Background sync

3. **Image Optimization:**
   - WebP conversion
   - Responsive images
   - Lazy loading

4. **CDN Integration:**
   - CloudFlare CDN
   - Edge caching
   - Geolocation routing

## Troubleshooting

### Common Issues:

1. **Images not loading:**
   - Check R2_PUBLIC_URL is set correctly
   - Verify CORS settings in R2
   - Check browser console for errors

2. **Slow loading:**
   - Check R2 region settings
   - Verify timeout settings
   - Consider using custom domain with CDN

3. **Connection resets:**
   - Handled automatically by retry logic
   - Check network stability
   - Verify R2 endpoint

### Debug Steps:

1. Open browser DevTools → Network tab
2. Filter by "Img" or "Media"
3. Check response status codes
4. Look for retry attempts in console
5. Verify URL construction

## Conclusion

The R2 storage connection is now optimized with:
- ✅ Automatic retry logic (backend & frontend)
- ✅ Connection pooling and timeouts
- ✅ Comprehensive error handling
- ✅ Image preloading and caching
- ✅ Better user feedback
- ✅ Graceful degradation
- ✅ Network resilience

These optimizations ensure reliable file operations even with unstable connections and provide a better user experience overall.
