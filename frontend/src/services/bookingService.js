import api from './api';

/**
 * Create a new movie booking reservation with atomic seat locking
 * @param {object} bookingData - { showtimeId, movieId, theatreId, date, seats, paymentMethod? }
 * @returns {Promise<object>} API response { success, message, data: populatedBooking }
 */
export const createBooking = async (bookingData) => {
  const response = await api.post('/bookings', bookingData);
  return response.data;
};

/**
 * Fetch booking history for the authenticated user
 * @returns {Promise<object>} API response { success, count, data: bookings[] }
 */
export const getMyBookings = async () => {
  const response = await api.get('/bookings/my');
  return response.data;
};

/**
 * Fetch a specific booking by ID
 * @param {string} id - Booking ObjectId
 * @returns {Promise<object>} API response { success, data: booking }
 */
export const getBookingById = async (id) => {
  const response = await api.get(`/bookings/${encodeURIComponent(id)}`);
  return response.data;
};

/**
 * Process a Demo Payment simulation for a pending booking
 * @param {string} id - Booking ObjectId
 * @param {object} payload - { simulateStatus: 'success' | 'failure' | 'cancelled', paymentMethod: string }
 * @returns {Promise<object>} API response { success, message, data: populatedBooking }
 */
export const processDemoPayment = async (id, payload) => {
  const response = await api.post(`/bookings/${encodeURIComponent(id)}/demo-payment`, payload);
  return response.data;
};

/**
 * Cancel a booking and release seats
 * @param {string} id - Booking ObjectId
 * @param {object} [payload] - { reason?: string }
 * @returns {Promise<object>} API response { success, message, data: booking }
 */
export const cancelBooking = async (id, payload = {}) => {
  const response = await api.post(`/bookings/${encodeURIComponent(id)}/cancel`, payload);
  return response.data;
};
