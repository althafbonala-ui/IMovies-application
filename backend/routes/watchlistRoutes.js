const express = require('express');
const router = express.Router();
const {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} = require('../controllers/watchlistController');
const { protect } = require('../middleware/authMiddleware');

/**
 * All watchlist endpoints are private and strictly require verified JWT Bearer token
 * User ID is always derived from req.user._id, never from request body.
 */
router.use(protect);

router
  .route('/')
  .get(getWatchlist)
  .post(addToWatchlist);

router
  .route('/:movieId')
  .post(addToWatchlist)
  .delete(removeFromWatchlist);

module.exports = router;
