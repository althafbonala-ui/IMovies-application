const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const {
  createReservation,
  processDemoPayment,
  cancelReservation,
} = require('../services/bookingService');
const { sendBookingConfirmationEmail } = require('../utils/emailService');

/**
 * @desc    Create a new movie booking with atomic seat reservation
 * @route   POST /api/bookings
 * @access  Private (Authenticated User only)
 */
const createBooking = async (req, res, next) => {
  try {
    const { showtimeId, movieId, theatreId, date, seats, paymentMethod } = req.body;

    // Security requirement: ALWAYS use authenticated user's ID from JWT; never trust req.body.userId / req.body.user
    const userId = req.user._id;

    if (!showtimeId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid showtimeId.',
      });
    }

    if (!seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one seat to book.',
      });
    }

    // Delegate to bookingService for atomic reservation, server-side price calculation, and rollback protection
    const reservationResult = await createReservation({
      userId,
      showtimeId,
      movieId,
      theatreId,
      date,
      seats,
      paymentMethod,
    });

    if (!reservationResult.success) {
      return res.status(reservationResult.statusCode || 400).json({
        success: false,
        message: reservationResult.error,
        conflictingSeats: reservationResult.conflictingSeats,
      });
    }

    // Populate movie and theatre details for the response
    const populatedBooking = await Booking.findById(reservationResult.booking._id)
      .populate('movie', 'title slug certification formats poster posterUrl accentColor duration')
      .populate('theatre', 'name slug city location badge facilities');

    return res.status(201).json({
      success: true,
      message: 'Reservation created! Proceed to complete demo payment.',
      data: populatedBooking || reservationResult.booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get booking history for the authenticated user only
 * @route   GET /api/bookings/my
 * @access  Private (Authenticated User only)
 */
const getMyBookings = async (req, res, next) => {
  try {
    // Only fetch bookings owned by the authenticated user
    const userId = req.user._id;

    const bookings = await Booking.find({ user: userId })
      .populate('movie', 'title slug certification formats poster posterUrl accentColor duration')
      .populate('theatre', 'name slug city location badge facilities')
      .populate('showtime', 'date time format price status')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get specific booking by ID
 * @route   GET /api/bookings/:id
 * @access  Private (Owner or Admin only)
 */
const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format.',
      });
    }

    const booking = await Booking.findById(id)
      .populate('movie', 'title slug certification formats poster posterUrl accentColor duration')
      .populate('theatre', 'name slug city location badge facilities')
      .populate('showtime', 'date time format price status')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    // Ownership check: user can only access their own booking unless they have admin role
    if (
      booking.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to view this booking.',
      });
    }

    return res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Simulate Demo Payment for a pending movie booking
 * @route   POST /api/bookings/:id/demo-payment
 * @access  Private (Authenticated User only)
 */
const handleDemoPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { simulateStatus, paymentMethod } = req.body;
    const userId = req.user._id;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format.',
      });
    }

    if (!simulateStatus || !['success', 'failure', 'cancelled'].includes(simulateStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid simulateStatus. Allowed values: 'success', 'failure', 'cancelled'.",
      });
    }

    const result = await processDemoPayment({
      bookingId: id,
      userId,
      simulateStatus,
      paymentMethod,
    });

    if (!result.success) {
      if (result.isDemoFailure || result.isDemoCancelled) {
        return res.status(200).json({
          success: false,
          isDemoFailure: result.isDemoFailure || false,
          isDemoCancelled: result.isDemoCancelled || false,
          message: result.error,
          data: result.booking,
        });
      }
      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.error,
      });
    }

    // Dispatch confirmation email with attached PDF ticket
    // Atomic duplicate prevention & safe error handling: never affects confirmed booking status
    let emailDeliveryResult = null;
    try {
      emailDeliveryResult = await sendBookingConfirmationEmail(result.booking._id);
    } catch (emailErr) {
      console.error('[BookingController] Non-fatal email dispatch exception:', emailErr.message);
    }

    // Retrieve updated booking to provide frontend with accurate delivery status
    const finalizedBooking = await Booking.findById(result.booking._id)
      .populate('movie', 'title slug certification formats poster posterUrl accentColor duration')
      .populate('theatre', 'name slug city location badge facilities')
      .populate('showtime', 'date time format price status')
      .populate('user', 'name email');

    return res.status(200).json({
      success: true,
      message: 'Demo payment simulated successfully! Booking confirmed.',
      data: finalizedBooking || result.booking,
      emailDelivery: emailDeliveryResult,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel a booking and release reserved seats
 * @route   POST /api/bookings/:id/cancel
 * @access  Private (Authenticated User only)
 */
const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { reason } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format.',
      });
    }

    const result = await cancelReservation({
      bookingId: id,
      userId,
      reason: reason || 'User requested cancellation',
    });

    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.error,
      });
    }

    // Populate movie, theatre, showtime, user for consistent details display
    const populatedBooking = await Booking.findById(result.booking._id)
      .populate('movie', 'title slug certification formats poster posterUrl accentColor duration')
      .populate('theatre', 'name slug city location badge facilities')
      .populate('showtime', 'date time format price status')
      .populate('user', 'name email');

    return res.status(200).json({
      success: true,
      message: 'Booking successfully cancelled and seats released.',
      data: populatedBooking || result.booking,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  handleDemoPayment,
  cancelBooking,
};
