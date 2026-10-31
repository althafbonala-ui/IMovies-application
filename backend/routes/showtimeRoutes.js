const express = require('express');
const router = express.Router();
const {
  getShowtimes,
  getShowtimeById,
  createShowtime,
  updateShowtime,
} = require('../controllers/showtimeController');
const { protect, admin } = require('../middleware/authMiddleware');

/**
 * Route: /api/shows
 * GET /       -> getShowtimes (public)
 * POST /      -> createShowtime (admin only)
 * GET /:id    -> getShowtimeById (public)
 * PUT /:id    -> updateShowtime (admin only)
 */
router
  .route('/')
  .get(getShowtimes)
  .post(protect, admin, createShowtime);

router
  .route('/:id')
  .get(getShowtimeById)
  .put(protect, admin, updateShowtime);

module.exports = router;

