// API Configuration
// This file centralizes all API-related configuration

// Auto-detect production environment
const isProduction = window.location.hostname.includes('legalkonect.site') || 
                     window.location.hostname.includes('vercel.app');

// Use production URLs when on production domain, otherwise use env vars or localhost
const API_BASE_URL = isProduction 
  ? 'https://api.legalkonect.site/api'
  : (process.env.REACT_APP_API_URL || 'http://localhost:8000/api');

const STORAGE_URL = isProduction
  ? 'https://api.legalkonect.site'
  : (process.env.REACT_APP_STORAGE_URL || 'http://localhost:8000');

console.log('API Config:', { isProduction, API_BASE_URL, hostname: window.location.hostname });

export { API_BASE_URL, STORAGE_URL };

export default {
  apiUrl: API_BASE_URL,
  storageUrl: STORAGE_URL,
};
