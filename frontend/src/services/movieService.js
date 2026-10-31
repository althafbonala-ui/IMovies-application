import api from './api';

/**
 * Fetch movies from backend with optional filters
 * @param {object} filters - { status?, language?, genre?, search? }
 * @returns {Promise<object>} { success, count, data }
 */
export const fetchMovies = async (filters = {}) => {
  const response = await api.get('/movies', { params: filters });
  return response.data;
};

/**
 * Fetch a single movie by ID or slug
 * @param {string} id - MongoDB ObjectId or movie slug
 * @returns {Promise<object>} { success, data }
 */
export const fetchMovieById = async (id) => {
  const response = await api.get(`/movies/${encodeURIComponent(id)}`);
  return response.data;
};

/**
 * Fetch theatres with optional city filter
 * @param {string} city - e.g. 'Anantapur'
 * @returns {Promise<object>} { success, count, data }
 */
export const fetchTheatres = async (city = 'Anantapur') => {
  const response = await api.get('/theatres', { params: { city } });
  return response.data;
};

/**
 * Fetch showtimes for movie, theatre, city, and date
 * @param {object} params - { movieId?, theatreId?, city?, date? }
 * @returns {Promise<object>} { success, count, data }
 */
export const fetchShowtimes = async (params = {}) => {
  const response = await api.get('/shows', { params });
  return response.data;
};

/**
 * Create a new movie (Admin only)
 * @param {object} movieData - Movie payload matching Movie schema
 * @returns {Promise<object>} { success, message, data: createdMovie }
 */
export const createMovie = async (movieData) => {
  const response = await api.post('/movies', movieData);
  return response.data;
};

/**
 * Update an existing movie (Admin only)
 * @param {string} id - MongoDB ObjectId or movie slug
 * @param {object} movieData - Movie fields to update
 * @returns {Promise<object>} { success, message, data: updatedMovie }
 */
export const updateMovie = async (id, movieData) => {
  const response = await api.put(`/movies/${encodeURIComponent(id)}`, movieData);
  return response.data;
};

/**
 * Delete a movie (Admin only)
 * @param {string} id - MongoDB ObjectId or movie slug
 * @returns {Promise<object>} { success, message, data? }
 */
export const deleteMovie = async (id) => {
  const response = await api.delete(`/movies/${encodeURIComponent(id)}`);
  return response.data;
};

