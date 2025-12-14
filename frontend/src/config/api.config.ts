// API Configuration
// This file centralizes all API-related configuration

// Auto-detect production environment
const isProduction = window.location.hostname.includes('legalkonect.site') || 
                     window.location.hostname.includes('vercel.app');

// Determine the base domain
const getBaseUrl = () => {
  if (!isProduction) {
    return process.env.REACT_APP_API_URL || 'http://localhost:8000';
  }
  
  // If we're on legalkonect.site (without subdomain), use api.legalkonect.site
  // If we're already on api.legalkonect.site, use it as is
  const hostname = window.location.hostname;
  if (hostname === 'legalkonect.site' || hostname === 'www.legalkonect.site') {
    return 'https://api.legalkonect.site';
  }
  
  // Default to api subdomain
  return 'https://api.legalkonect.site';
};

const BASE_URL = getBaseUrl();

// Use production URLs when on production domain, otherwise use env vars or localhost
const API_BASE_URL = isProduction 
  ? `${BASE_URL}/api`
  : (process.env.REACT_APP_API_URL || 'http://localhost:8000/api');

const STORAGE_URL = isProduction
  ? BASE_URL
  : (process.env.REACT_APP_STORAGE_URL || 'http://localhost:8000');

console.log('API Config:', { isProduction, API_BASE_URL, hostname: window.location.hostname });

export { API_BASE_URL, STORAGE_URL };

export default {
  apiUrl: API_BASE_URL,
  storageUrl: STORAGE_URL,
};
