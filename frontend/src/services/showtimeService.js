import api from './api';

/**
 * Fetch showtimes with optional filters
 * @param {object} [params] - { movieId?, theatreId?, city?, date? }
 * @returns {Promise<object>} { success, count, data: Showtime[] }
 */
export const fetchShowtimes = async (params = {}) => {
  const response = await api.get('/shows', { params });
  return response.data;
};

/**
 * Fetch a single showtime by ID
 * @param {string} id - MongoDB ObjectId
 * @returns {Promise<object>} { success, data: Showtime }
 */
export const fetchShowtimeById = async (id) => {
  const response = await api.get(`/shows/${encodeURIComponent(id)}`);
  return response.data;
};

/**
 * Schedule a new showtime (Admin only)
 * @param {object} showData - Showtime payload matching Showtime schema
 * @returns {Promise<object>} { success, message, data: createdShowtime }
 */
export const createShowtime = async (showData) => {
  const response = await api.post('/shows', showData);
  return response.data;
};

/**
 * Update an existing showtime (Admin only)
 * @param {string} id - MongoDB ObjectId
 * @param {object} showData - Fields to update
 * @returns {Promise<object>} { success, message, data: updatedShowtime }
 */
export const updateShowtime = async (id, showData) => {
  const response = await api.put(`/shows/${encodeURIComponent(id)}`, showData);
  return response.data;
};
