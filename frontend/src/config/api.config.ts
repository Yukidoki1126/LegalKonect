// API Configuration
// This file centralizes all API-related configuration

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const STORAGE_URL = process.env.REACT_APP_STORAGE_URL || 'http://localhost:8000';

export { API_BASE_URL, STORAGE_URL };

export default {
  apiUrl: API_BASE_URL,
  storageUrl: STORAGE_URL,
};
