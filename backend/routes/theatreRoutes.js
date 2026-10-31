const express = require('express');
const router = express.Router();
const {
  getTheatres,
  getTheatreById,
  createTheatre,
  updateTheatre,
} = require('../controllers/theatreController');
const { protect, admin } = require('../middleware/authMiddleware');

/**
 * Route: /api/theatres
 * GET /       -> getTheatres (public)
 * POST /      -> createTheatre (admin only)
 * GET /:id    -> getTheatreById (public)
 * PUT /:id    -> updateTheatre (admin only)
 */
router
  .route('/')
  .get(getTheatres)
  .post(protect, admin, createTheatre);

router
  .route('/:id')
  .get(getTheatreById)
  .put(protect, admin, updateTheatre);

module.exports = router;

