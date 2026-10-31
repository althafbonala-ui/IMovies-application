import api from './api';

/**
 * Fetch aggregated cinema statistics for the Admin Dashboard
 * @returns {Promise<object>} API response { success, message, data: { bookings, financials, catalog, recentBookings } }
 */
export const fetchAdminStats = async () => {
  const response = await api.get('/admin/stats');
  return response.data;
};
