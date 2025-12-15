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
  // Get dashboard stats (no cache for reliability)
  getDashboard: async () => {
    const response = await axios.get(`${API_URL}/lawyer/dashboard`, {
      headers: getAuthHeader(),
    });
    return response.data;
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

  // Request reschedule
  requestReschedule: async (appointmentId: number, data: { proposed_date: string; proposed_time: string; reason: string }) => {
    const response = await axios.post(
      `${API_URL}/lawyer/appointments/${appointmentId}/reschedule`,
      data,
      { headers: getAuthHeader() }
    );
    // Invalidate cache after mutation - clear all appointment-related cache
    cacheService.invalidatePattern('appointments');
    cacheService.invalidatePattern('dashboard');
    return response.data;
  },

  // Respond to client's reschedule request
  respondToClientReschedule: async (appointmentId: number, response: 'accept' | 'decline') => {
    const res = await axios.post(
      `${API_URL}/lawyer/appointments/${appointmentId}/respond-to-client-reschedule`,
      { response },
      { headers: getAuthHeader() }
    );
    // Invalidate cache after mutation
    cacheService.invalidatePattern('appointments');
    cacheService.invalidatePattern('dashboard');
    return res.data;
  },

  // Bulk reschedule appointments
  bulkReschedule: async (data: { original_date: string; proposed_date: string; proposed_time: string; reason: string; appointment_ids: number[] }) => {
    const response = await axios.post(
      `${API_URL}/lawyer/appointments/bulk-reschedule`,
      data,
      { headers: getAuthHeader() }
    );
    // Invalidate cache after mutation - clear all appointment-related cache
    cacheService.invalidatePattern('appointments');
    cacheService.invalidatePattern('dashboard');
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

  // Confirm/Set specialization for an appointment
  confirmSpecialization: async (appointmentId: number, specializationId: number) => {
    const response = await axios.post(
      `${API_URL}/lawyer/appointments/${appointmentId}/confirm-specialization`,
      { specialization_id: specializationId },
      { headers: getAuthHeader() }
    );
    // Invalidate cache after mutation
    cacheService.invalidatePattern('/lawyer/appointments');
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

  // Get lawyer profile without cache (for verification status checks)
  getProfileFresh: async () => {
    const response = await axios.get(`${API_URL}/lawyer/profile`, {
      headers: getAuthHeader(),
    });
    return response.data;
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

  // Get cases - cached for 30 seconds
  getCases: async () => {
    return cachedGet(`${API_URL}/lawyer/cases`, 30000);
  },

  // Get completed appointments for case creation - cached for 30 seconds
  getCompletedAppointments: async () => {
    return cachedGet(`${API_URL}/lawyer/cases/completed-appointments`, 30000);
  },

  // Create case
  createCase: async (data: any) => {
    const response = await axios.post(`${API_URL}/lawyer/cases`, data, {
      headers: getAuthHeader(),
    });
    // Invalidate cache after mutation
    cacheService.invalidatePattern('/lawyer/cases');
    return response.data;
  },

  // Update case
  updateCase: async (caseId: number, data: any) => {
    const response = await axios.put(`${API_URL}/lawyer/cases/${caseId}`, data, {
      headers: getAuthHeader(),
    });
    // Invalidate cache after mutation
    cacheService.invalidatePattern('/lawyer/cases');
    return response.data;
  },

  // Get case todos
  getCaseTodos: async (caseId: number) => {
    return cachedGet(`${API_URL}/lawyer/cases/${caseId}/todos`, 20000);
  },

  // Create todo
  createTodo: async (caseId: number, data: any) => {
    const response = await axios.post(`${API_URL}/lawyer/cases/${caseId}/todos`, data, {
      headers: getAuthHeader(),
    });
    // Invalidate cache after mutation
    cacheService.invalidatePattern(`/lawyer/cases/${caseId}/todos`);
    cacheService.invalidatePattern('/lawyer/cases');
    return response.data;
  },

  // Toggle todo completion
  toggleTodo: async (caseId: number, todoId: number) => {
    const response = await axios.post(
      `${API_URL}/lawyer/cases/${caseId}/todos/${todoId}/toggle`,
      {},
      { headers: getAuthHeader() }
    );
    // Invalidate cache after mutation
    cacheService.invalidatePattern(`/lawyer/cases/${caseId}/todos`);
    cacheService.invalidatePattern('/lawyer/cases');
    return response.data;
  },

  // Delete todo
  deleteTodo: async (caseId: number, todoId: number) => {
    const response = await axios.delete(
      `${API_URL}/lawyer/cases/${caseId}/todos/${todoId}`,
      { headers: getAuthHeader() }
    );
    // Invalidate cache after mutation
    cacheService.invalidatePattern(`/lawyer/cases/${caseId}/todos`);
    cacheService.invalidatePattern('/lawyer/cases');
    return response.data;
  },

  // Google Calendar - Get status - cached for 30 seconds
  getGoogleCalendarStatus: async () => {
    return cachedGet(`${API_URL}/lawyer/google/status`, 30000);
  },

  // Google Calendar - Get auth URL
  getGoogleAuthUrl: async () => {
    const response = await axios.get(`${API_URL}/lawyer/google/auth-url`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Google Calendar - Disconnect
  disconnectGoogleCalendar: async () => {
    const response = await axios.post(
      `${API_URL}/lawyer/google/disconnect`,
      {},
      { headers: getAuthHeader() }
    );
    // Invalidate cache after mutation
    cacheService.invalidatePattern('/lawyer/google/status');
    cacheService.invalidatePattern('/lawyer/calendar');
    cacheService.invalidatePattern('/lawyer/google/events');
    return response.data;
  },

  // Calendar - Get appointments - cached for 20 seconds
  getCalendarAppointments: async (startDate: string, endDate: string) => {
    return cachedGet(
      `${API_URL}/lawyer/calendar/appointments?start_date=${startDate}&end_date=${endDate}`,
      20000
    );
  },

  // Calendar - Get Google Calendar events - cached for 20 seconds
  getGoogleCalendarEvents: async (startDate: string, endDate: string) => {
    return cachedGet(
      `${API_URL}/lawyer/google/events?start_date=${startDate}&end_date=${endDate}`,
      20000
    );
  },

  // Google Calendar - Sync appointments
  syncAppointmentsToGoogleCalendar: async () => {
    const response = await axios.post(
      `${API_URL}/lawyer/google/sync-appointments`,
      {},
      { headers: getAuthHeader() }
    );
    // Invalidate calendar cache after sync
    cacheService.invalidatePattern('/lawyer/calendar');
    cacheService.invalidatePattern('/lawyer/google/events');
    return response.data;
  },

  // Weekly Schedule - Get schedules - cached for 30 seconds
  getSchedules: async () => {
    return cachedGet(`${API_URL}/lawyer/schedules`, 30000);
  },

  // Weekly Schedule - Create schedule
  createSchedule: async (data: any) => {
    const response = await axios.post(`${API_URL}/lawyer/schedules`, data, {
      headers: getAuthHeader(),
    });
    // Invalidate cache after mutation
    cacheService.invalidatePattern('/lawyer/schedules');
    return response.data;
  },

  // Weekly Schedule - Update schedule
  updateSchedule: async (scheduleId: number, data: any) => {
    const response = await axios.put(`${API_URL}/lawyer/schedules/${scheduleId}`, data, {
      headers: getAuthHeader(),
    });
    // Invalidate cache after mutation
    cacheService.invalidatePattern('/lawyer/schedules');
    return response.data;
  },

  // Weekly Schedule - Delete schedule
  deleteSchedule: async (scheduleId: number) => {
    const response = await axios.delete(`${API_URL}/lawyer/schedules/${scheduleId}`, {
      headers: getAuthHeader(),
    });
    // Invalidate cache after mutation
    cacheService.invalidatePattern('/lawyer/schedules');
    return response.data;
  },

  // Weekly Schedule - Toggle schedule
  toggleSchedule: async (scheduleId: number) => {
    const response = await axios.post(
      `${API_URL}/lawyer/schedules/${scheduleId}/toggle`,
      {},
      { headers: getAuthHeader() }
    );
    // Invalidate cache after mutation
    cacheService.invalidatePattern('/lawyer/schedules');
    return response.data;
  },

  // Payment Info - Update payment information (GCash/Bank)
  updatePaymentInfo: async (data: {
    gcash_number?: string;
    gcash_account_name?: string;
    bank_name?: string;
    bank_account_number?: string;
    bank_account_name?: string;
    preferred_payout_method: 'gcash' | 'bank';
  }) => {
    const response = await axios.put(`${API_URL}/lawyer/payment-info`, data, {
      headers: getAuthHeader(),
    });
    cacheService.invalidatePattern('/lawyer/profile');
    return response.data;
  },

  // Payment Info - Upload GCash QR code
  uploadGcashQr: async (file: File) => {
    const formData = new FormData();
    formData.append('gcash_qr', file);
    const response = await axios.post(`${API_URL}/lawyer/gcash-qr`, formData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data',
      },
    });
    cacheService.invalidatePattern('/lawyer/profile');
    return response.data;
  },

  // Payment Info - Delete GCash QR code
  deleteGcashQr: async () => {
    const response = await axios.delete(`${API_URL}/lawyer/gcash-qr`, {
      headers: getAuthHeader(),
    });
    cacheService.invalidatePattern('/lawyer/profile');
    return response.data;
  },

  // Payment - Confirm client payment
  confirmPayment: async (appointmentId: number) => {
    const response = await axios.post(
      `${API_URL}/lawyer/appointments/${appointmentId}/confirm-payment`,
      {},
      { headers: getAuthHeader() }
    );
    cacheService.invalidatePattern('/lawyer/appointments');
    return response.data;
  },

  // Payment - Reject client payment
  rejectPayment: async (appointmentId: number, reason: string) => {
    const response = await axios.post(
      `${API_URL}/lawyer/appointments/${appointmentId}/reject-payment`,
      { reason },
      { headers: getAuthHeader() }
    );
    cacheService.invalidatePattern('/lawyer/appointments');
    return response.data;
  },

  // Payment - Get payment proof
  getPaymentProof: async (appointmentId: number) => {
    const response = await axios.get(
      `${API_URL}/lawyer/appointments/${appointmentId}/payment-proof`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Refund - Process refund with receipt
  processRefund: async (appointmentId: number, formData: FormData) => {
    const response = await axios.post(
      `${API_URL}/lawyer/appointments/${appointmentId}/process-refund`,
      formData,
      {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    cacheService.invalidatePattern('/lawyer/appointments');
    return response.data;
  },

  // Transaction History - Get completed appointments
  getTransactionHistory: async (page: number = 1) => {
    const response = await axios.get(`${API_URL}/lawyer/transactions?page=${page}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Old Payout methods - DEPRECATED (keeping for compatibility)
  updatePayoutInfo: async (data: {
    gcash_number?: string;
    gcash_account_name?: string;
    bank_name?: string;
    bank_account_number?: string;
    bank_account_name?: string;
    preferred_payout_method: 'gcash' | 'bank';
  }) => {
    // Redirect to new payment info endpoint
    const response = await axios.put(`${API_URL}/lawyer/payment-info`, data, {
      headers: getAuthHeader(),
    });
    cacheService.invalidatePattern('/lawyer/profile');
    return response.data;
  },

  // Payouts - Request payout - DEPRECATED
  requestPayout: async (amount: number, payoutMethod?: 'gcash' | 'bank') => {
    console.warn('requestPayout is deprecated - lawyers now receive payments directly');
    return { message: 'Payout system disabled - you receive payments directly now' };
  },

  // Payouts - Get payout history - DEPRECATED
  getPayouts: async () => {
    console.warn('getPayouts is deprecated - use getTransactionHistory instead');
    return { payouts: [], message: 'Payout system disabled - use transaction history' };
  },
};