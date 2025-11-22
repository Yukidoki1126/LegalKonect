import axios from 'axios';
import { cacheService } from './cacheService';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add token to every request
api.interceptors.request.use(
  (config) => {
    console.log('🌐 API REQUEST:', config.method?.toUpperCase(), config.url);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for caching
api.interceptors.response.use(
  (response) => {
    // Cache GET requests
    if (response.config.method === 'get' && response.config.url) {
      const cacheKey = response.config.url;
      cacheService.set(cacheKey, response.data, 2 * 60 * 1000); // 2 minutes cache
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Enhanced GET with cache
export const cachedGet = async <T = any>(url: string, ttl?: number): Promise<T> => {
  // Check cache first
  const cached = cacheService.get<T>(url);
  if (cached) {
    return Promise.resolve(cached);
  }

  // Fetch from API
  const response = await api.get<T>(url);
  cacheService.set(url, response.data, ttl);
  return response.data;
};

// Invalidate cache helper
export const invalidateCache = (pattern: string) => {
  cacheService.invalidatePattern(pattern);
};

// Clear all cache
export const clearCache = () => {
  cacheService.clear();
};

// Authentication API calls
export const authAPI = {
  register: (userData: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
  }) => {
    return api.post('/auth/register', userData);
  },

  login: (credentials: {
    email: string;
    password: string;
  }) => {
    return api.post('/auth/login', credentials);
  },

  logout: () => {
    return api.post('/auth/logout');
  },

  getProfile: () => {
    return api.get('/auth/profile');
  },

  uploadProfilePicture: (file: File) => {
    const formData = new FormData();
    formData.append('profile_picture', file);
    // Need to override the default Content-Type to allow FormData
    return api.post('/auth/profile-picture', formData, {
      headers: {
        'Content-Type': undefined, // Let browser set it with boundary
      },
      transformRequest: [(data) => data], // Prevent axios from stringifying FormData
    });
  },

  deleteProfilePicture: () => {
    return api.delete('/auth/profile-picture');
  }
};

export default api;