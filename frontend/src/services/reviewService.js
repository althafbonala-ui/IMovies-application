import api from './api';

/**
 * Fetch reviews and ratings statistics for a given movie
 * @param {string} movieId - MongoDB ObjectId or movie slug
 * @returns {Promise<object>} { success, count, averageRating, totalReviews, ratingBreakdown, data }
 */
export const fetchMovieReviews = async (movieId) => {
  const response = await api.get(`/movies/${encodeURIComponent(movieId)}/reviews`);
  return response.data;
};

/**
 * Submit a new review for a movie (Authenticated)
 * @param {string} movieId - MongoDB ObjectId or movie slug
 * @param {object} reviewData - { rating: number, reviewText: string }
 * @returns {Promise<object>} { success, message, data, averageRating, totalReviews, ratingBreakdown }
 */
export const createMovieReview = async (movieId, reviewData) => {
  const response = await api.post(`/movies/${encodeURIComponent(movieId)}/reviews`, reviewData);
  return response.data;
};

/**
 * Update a user's own review (Authenticated)
 * @param {string} reviewId - MongoDB ObjectId of the review
 * @param {object} reviewData - { rating?: number, reviewText?: string }
 * @returns {Promise<object>} { success, message, data, averageRating, totalReviews, ratingBreakdown }
 */
export const updateMovieReview = async (reviewId, reviewData) => {
  const response = await api.put(`/reviews/${encodeURIComponent(reviewId)}`, reviewData);
  return response.data;
};

/**
 * Delete a user's own review (Authenticated)
 * @param {string} reviewId - MongoDB ObjectId of the review
 * @returns {Promise<object>} { success, message, averageRating, totalReviews, ratingBreakdown }
 */
export const deleteMovieReview = async (reviewId) => {
  const response = await api.delete(`/reviews/${encodeURIComponent(reviewId)}`);
  return response.data;
};
