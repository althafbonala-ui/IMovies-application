const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBookingById,
  handleDemoPayment,
  cancelBooking,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

// All booking routes require JWT authentication
router.use(protect);

// @route   POST /api/bookings
router.route('/').post(createBooking);

// @route   GET /api/bookings/my
router.route('/my').get(getMyBookings);

// @route   GET /api/bookings/:id
router.route('/:id').get(getBookingById);

// @route   POST /api/bookings/:id/demo-payment
router.route('/:id/demo-payment').post(handleDemoPayment);

// @route   POST /api/bookings/:id/cancel
router.route('/:id/cancel').post(cancelBooking);

module.exports = router;
