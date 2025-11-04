import axios from 'axios';

const API_URL = 'http://localhost:8000/api/admin';

const adminApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add token to requests
adminApi.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Simple in-memory cache
const cache: { [key: string]: { data: any; timestamp: number } } = {};
const CACHE_DURATION = 30000; // 30 seconds

// Cache interceptor for GET requests
adminApi.interceptors.request.use((config) => {
  if (config.method === 'get' && config.url) {
    const cacheKey = config.url;
    const cached = cache[cacheKey];
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      // Return cached data
      return Promise.reject({
        config,
        response: { data: cached.data, status: 200 },
        cached: true
      });
    }
  }
  return config;
});

// Cache response interceptor
adminApi.interceptors.response.use(
  (response) => {
    // Cache GET responses
    if (response.config.method === 'get' && response.config.url) {
      cache[response.config.url] = {
        data: response.data,
        timestamp: Date.now()
      };
    }
    return response;
  },
  (error) => {
    // If it's a cached response, resolve it
    if (error.cached) {
      return Promise.resolve(error.response);
    }
    return Promise.reject(error);
  }
);

// Function to clear cache
export const clearAdminCache = () => {
  Object.keys(cache).forEach(key => delete cache[key]);
};

export const adminAuthService = {
  login: async (email: string, password: string) => {
    const response = await adminApi.post('/login', { email, password });
    if (response.data.token) {
      sessionStorage.setItem('admin_token', response.data.token);
      sessionStorage.setItem('admin', JSON.stringify(response.data.admin));
    }
    return response.data;
  },

  logout: async () => {
    await adminApi.post('/logout');
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin');
    clearAdminCache(); // Clear cache on logout
  },

  me: async () => {
    const response = await adminApi.get('/me');
    return response.data.admin;
  },
};

export default adminApi;