// Central API configuration for all API calls
// This ensures production deployment works correctly

// Determine API URL based on environment
const isProduction = window.location.hostname.includes('vercel.app') || window.location.hostname.includes('legalkonect');
const PRODUCTION_API = 'https://legalkonect-production-fdcb.up.railway.app/api';
const LOCAL_API = 'http://localhost:8000/api';

export const API_BASE_URL = isProduction ? PRODUCTION_API : (process.env.REACT_APP_API_URL || LOCAL_API);

// Storage URL for uploaded files (images, documents, etc.)
export const STORAGE_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8000';

// Remove /api suffix if present
export const getStorageUrl = (path?: string) => {
  if (!path) return '/default-avatar.png';

  // If path already includes full URL, return as is
  if (path.startsWith('http')) return path;

  // Otherwise, prepend storage URL
  return `${STORAGE_URL}/storage/${path}`;
};

export default {
  API_BASE_URL,
  STORAGE_URL,
  getStorageUrl
};
// Force redeploy
