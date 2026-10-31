import api from './api';

/**
 * Fetch theatres with optional city filter
 * @param {string} [city] - Optional city name (e.g. 'Anantapur')
 * @returns {Promise<object>} { success, count, data: Theatre[] }
 */
export const fetchTheatres = async (city) => {
  const params = city && city !== 'All' ? { city } : {};
  const response = await api.get('/theatres', { params });
  return response.data;
};

/**
 * Fetch a single theatre by ID or slug
 * @param {string} id - MongoDB ObjectId or theatre slug
 * @returns {Promise<object>} { success, data: Theatre }
 */
export const fetchTheatreById = async (id) => {
  const response = await api.get(`/theatres/${encodeURIComponent(id)}`);
  return response.data;
};

/**
 * Create a new theatre (Admin only)
 * @param {object} theatreData - Theatre payload matching Theatre schema
 * @returns {Promise<object>} { success, message, data: createdTheatre }
 */
export const createTheatre = async (theatreData) => {
  const response = await api.post('/theatres', theatreData);
  return response.data;
};

/**
 * Update an existing theatre (Admin only)
 * @param {string} id - MongoDB ObjectId or theatre slug
 * @param {object} theatreData - Fields to update
 * @returns {Promise<object>} { success, message, data: updatedTheatre }
 */
export const updateTheatre = async (id, theatreData) => {
  const response = await api.put(`/theatres/${encodeURIComponent(id)}`, theatreData);
  return response.data;
};
