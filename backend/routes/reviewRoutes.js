const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getReviewsForMovie,
  createReview,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

/**
 * Route: /api/movies/:movieId/reviews OR /api/reviews
 *
 * GET    /                   -> getReviewsForMovie (Public)
 * POST   /                   -> createReview (Private)
 * GET    /movie/:movieId     -> getReviewsForMovie (Public)
 * PUT    /:id                -> updateReview (Private)
 * DELETE /:id                -> deleteReview (Private)
 */

router
  .route('/')
  .get(getReviewsForMovie)
  .post(protect, createReview);

router.get('/movie/:movieId', getReviewsForMovie);

router
  .route('/:id')
  .put(protect, updateReview)
  .delete(protect, deleteReview);

module.exports = router;
