import axios from 'axios';
import { cacheService } from './cacheService';

const API_URL = 'http://localhost:8000/api';

// Get token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Cached GET request helper
const cachedGet = async <T = any>(url: string, ttl: number = 30000): Promise<T> => {
  const cached = cacheService.get<T>(url);
  if (cached) {
    return cached;
  }

  const response = await axios.get(url, {
    headers: getAuthHeader(),
  });

  cacheService.set(url, response.data, ttl);
  return response.data;
};

export const lawyerApi = {
  // Get dashboard stats (cached for 30 seconds)
  getDashboard: async () => {
    return cachedGet(`${API_URL}/lawyer/dashboard`, 30000);
  },

  // Get appointments (optional status filter) - cached for 20 seconds
  getAppointments: async (status?: string) => {
    const url = status
      ? `${API_URL}/lawyer/appointments?status=${status}`
      : `${API_URL}/lawyer/appointments`;

    return cachedGet(url, 20000);
  },

  // Accept appointment
  acceptAppointment: async (appointmentId: number) => {
    const response = await axios.post(
      `${API_URL}/lawyer/appointments/${appointmentId}/accept`,
      {},
      { headers: getAuthHeader() }
    );
    // Invalidate cache after mutation
    cacheService.invalidatePattern('/lawyer/appointments');
    cacheService.invalidatePattern('/lawyer/dashboard');
    return response.data;
  },

  // Decline appointment
  declineAppointment: async (appointmentId: number, reason: string) => {
    const response = await axios.post(
      `${API_URL}/lawyer/appointments/${appointmentId}/decline`,
      { reason },
      { headers: getAuthHeader() }
    );
    // Invalidate cache after mutation
    cacheService.invalidatePattern('/lawyer/appointments');
    cacheService.invalidatePattern('/lawyer/dashboard');
    return response.data;
  },

  // Complete appointment
  completeAppointment: async (appointmentId: number) => {
    const response = await axios.post(
      `${API_URL}/lawyer/appointments/${appointmentId}/complete`,
      {},
      { headers: getAuthHeader() }
    );
    // Invalidate cache after mutation
    cacheService.invalidatePattern('/lawyer/appointments');
    cacheService.invalidatePattern('/lawyer/dashboard');
    cacheService.invalidatePattern('/lawyer/earnings');
    return response.data;
  },

  // Add notes to appointment
  addNotes: async (appointmentId: number, notes: string) => {
    const response = await axios.post(
      `${API_URL}/lawyer/appointments/${appointmentId}/notes`,
      { notes },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Get earnings - cached for 60 seconds
  getEarnings: async () => {
    return cachedGet(`${API_URL}/lawyer/earnings`, 60000);
  },

  // Toggle availability
  toggleAvailability: async () => {
    const response = await axios.post(
      `${API_URL}/lawyer/toggle-availability`,
      {},
      { headers: getAuthHeader() }
    );
    // Invalidate cache after mutation
    cacheService.invalidatePattern('/lawyer/dashboard');
    cacheService.invalidatePattern('/lawyer/profile');
    return response.data;
  },

  // Get lawyer profile - cached for 60 seconds
  getProfile: async () => {
    return cachedGet(`${API_URL}/lawyer/profile`, 60000);
  },

  // Update lawyer profile
  updateProfile: async (data: any) => {
    const response = await axios.put(`${API_URL}/lawyer/profile`, data, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Get specializations - cached for 5 minutes (rarely changes)
  getSpecializations: async () => {
    const data = await cachedGet(`${API_URL}/specializations`, 5 * 60 * 1000);
    return data.specializations || data;
  },

  // Get calendar availability for a specific month - cached for 30 seconds
  getCalendarAvailability: async (year: number, month: number) => {
    return cachedGet(
      `${API_URL}/lawyer/calendar/availability?year=${year}&month=${month}`,
      30000
    );
  },

  // Set availability for a specific date
  setDateAvailability: async (date: string, isAvailable: boolean) => {
    const response = await axios.post(
      `${API_URL}/lawyer/calendar/availability`,
      { date, is_available: isAvailable },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Upload profile photo
  uploadProfilePhoto: async (file: File) => {
    const formData = new FormData();
    formData.append('profile_photo', file);
    const response = await axios.post(
      `${API_URL}/lawyer/profile-photo`,
      formData,
      {
        headers: getAuthHeader(),
        // Don't set Content-Type - let axios set it with the boundary
      }
    );
    return response.data;
  },

  // Delete profile photo
  deleteProfilePhoto: async () => {
    const response = await axios.delete(`${API_URL}/lawyer/profile-photo`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },
};