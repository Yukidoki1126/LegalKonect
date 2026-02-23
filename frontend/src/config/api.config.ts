// API Configuration
// This file centralizes all API-related configuration

// Auto-detect production environment
const isProduction = window.location.hostname.includes('legalkonect.site') || 
                     window.location.hostname.includes('vercel.app');

// Determine the base domain
const getBaseUrl = () => {
  // Check for environment variable first (set in Vercel)
  if (process.env.REACT_APP_API_URL) {
    // Remove /api suffix if present, we'll add it back later
    return process.env.REACT_APP_API_URL.replace(/\/api$/, '');
  }
  
  if (!isProduction) {
    return 'http://localhost:8000';
  }
  
  const hostname = window.location.hostname;
  
  // If on legalkonect-render.vercel.app, use Render backend
  if (hostname.includes('legalkonect-render.vercel.app')) {
    return 'https://legalkonect.onrender.com';
  }
  
  // If on legalkonect.vercel.app (without -render), also use Render backend
  if (hostname.includes('legalkonect.vercel.app')) {
    return 'https://legalkonect.onrender.com';
  }
  
  // If we're on legalkonect.site, use api.legalkonect.site
  if (hostname === 'legalkonect.site' || hostname === 'www.legalkonect.site') {
    return 'https://api.legalkonect.site';
  }
  
  // Default to Render backend
  return 'https://legalkonect.onrender.com';
};

const BASE_URL = getBaseUrl();

// Use production URLs when on production domain, otherwise use env vars or localhost
const API_BASE_URL = `${BASE_URL}/api`;

const STORAGE_URL = isProduction
  ? BASE_URL
  : (process.env.REACT_APP_STORAGE_URL || 'http://localhost:8000');

console.log('API Config:', { isProduction, API_BASE_URL, hostname: window.location.hostname });

export { API_BASE_URL, STORAGE_URL };

export default {
  apiUrl: API_BASE_URL,
  storageUrl: STORAGE_URL,
};
