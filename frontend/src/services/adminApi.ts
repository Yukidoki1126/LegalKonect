import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';

const API_URL = `${API_BASE_URL.replace('/api', '')}/api/admin`;

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

// Admin Management Service (Super Admin Only)
export const adminManagementService = {
  // Get all admins
  getAdmins: async () => {
    const response = await adminApi.get('/admins');
    return response.data;
  },

  // Get admin statistics
  getStats: async () => {
    const response = await adminApi.get('/admins/stats');
    return response.data;
  },

  // Create new admin
  createAdmin: async (adminData: {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'super_admin';
  }) => {
    const response = await adminApi.post('/admins', adminData);
    clearAdminCache(); // Clear cache after creating
    return response.data;
  },

  // Update admin
  updateAdmin: async (id: number, adminData: {
    name?: string;
    email?: string;
    password?: string;
    role?: 'admin' | 'super_admin';
    status?: 'active' | 'suspended';
  }) => {
    const response = await adminApi.put(`/admins/${id}`, adminData);
    clearAdminCache(); // Clear cache after updating
    return response.data;
  },

  // Delete admin
  deleteAdmin: async (id: number) => {
    const response = await adminApi.delete(`/admins/${id}`);
    clearAdminCache(); // Clear cache after deleting
    return response.data;
  },
};

// Admin Payout Management Service
export const adminPayoutService = {
  // Get all payouts with optional filtering
  getPayouts: async (status?: string, page: number = 1, perPage: number = 20) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', page.toString());
    params.append('per_page', perPage.toString());

    const response = await adminApi.get(`/payouts?${params.toString()}`);
    return response.data;
  },

  // Get pending payouts
  getPendingPayouts: async () => {
    const response = await adminApi.get('/payouts/pending');
    return response.data;
  },

  // Approve payout
  approvePayout: async (id: number) => {
    const response = await adminApi.post(`/payouts/${id}/approve`);
    clearAdminCache(); // Clear cache after approval
    return response.data;
  },

  // Mark payout as paid
  markAsPaid: async (id: number, data: { transaction_reference: string; admin_notes?: string }) => {
    const response = await adminApi.post(`/payouts/${id}/mark-paid`, data);
    clearAdminCache(); // Clear cache after marking as paid
    return response.data;
  },

  // Reject payout
  rejectPayout: async (id: number, data: { rejection_reason: string }) => {
    const response = await adminApi.post(`/payouts/${id}/reject`, data);
    clearAdminCache(); // Clear cache after rejection
    return response.data;
  },
};

export default adminApi;