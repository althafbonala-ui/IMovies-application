import api from './api';

/**
 * Fetch authenticated user's saved watchlist
 * @returns {Promise<object>} { success: true, count: number, data: Movie[] }
 */
export const getWatchlist = async () => {
  const response = await api.get('/watchlist');
  return response.data;
};

/**
 * Add a movie to user's watchlist
 * @param {string} movieId - Movie ObjectId or slug
 * @returns {Promise<object>} { success: true, message: string, data: Movie[] }
 */
export const addToWatchlist = async (movieId) => {
  const response = await api.post(`/watchlist/${encodeURIComponent(movieId)}`);
  return response.data;
};

/**
 * Remove a movie from user's watchlist
 * @param {string} movieId - Movie ObjectId or slug
 * @returns {Promise<object>} { success: true, message: string, data: Movie[] }
 */
export const removeFromWatchlist = async (movieId) => {
  const response = await api.delete(`/watchlist/${encodeURIComponent(movieId)}`);
  return response.data;
};
