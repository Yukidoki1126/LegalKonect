// Central API configuration for all API calls
// This ensures production deployment works correctly

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

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
