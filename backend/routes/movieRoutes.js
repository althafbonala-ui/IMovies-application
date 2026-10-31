const express = require('express');
const router = express.Router();
const {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
} = require('../controllers/movieController');
const { protect, admin } = require('../middleware/authMiddleware');

/**
 * Route: /api/movies
 * GET /          -> getMovies (public)
 * POST /         -> createMovie (admin only)
 * GET /:id       -> getMovieById (public)
 * PUT /:id       -> updateMovie (admin only)
 * DELETE /:id    -> deleteMovie (admin only)
 */
router
  .route('/')
  .get(getMovies)
  .post(protect, admin, createMovie);

router
  .route('/:id')
  .get(getMovieById)
  .put(protect, admin, updateMovie)
  .delete(protect, admin, deleteMovie);

// Re-route into review router
const reviewRoutes = require('./reviewRoutes');
router.use('/:movieId/reviews', reviewRoutes);

module.exports = router;
