const mongoose = require('mongoose');
const Showtime = require('../models/Showtime');
const Booking = require('../models/Booking');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');

/**
 * Validates requested seats array for format, non-emptiness, and internal duplicates
 * @param {Array<string>} seats
 * @returns {{ valid: boolean, message?: string, cleanedSeats?: string[] }}
 */
const validateSeatSelection = (seats) => {
  if (!Array.isArray(seats) || seats.length === 0) {
    return { valid: false, message: 'Please select at least one seat.' };
  }

  if (seats.length > 8) {
    return { valid: false, message: 'A maximum of 8 seats can be reserved per booking.' };
  }

  // Clean seat strings (e.g. trim, uppercase like 'A1', 'B5')
  const cleanedSeats = [];
  const seatRegex = /^[A-Z]\d{1,2}$/;

  for (const s of seats) {
    if (typeof s !== 'string') {
      return { valid: false, message: 'Invalid seat identifier format.' };
    }
    const trimmed = s.trim().toUpperCase();
    if (!seatRegex.test(trimmed)) {
      return {
        valid: false,
        message: `Invalid seat label "${s}". Seats must follow row-number format (e.g. A1, B10).`,
      };
    }
    cleanedSeats.push(trimmed);
  }

  // Check for internal duplicates within the request
  const uniqueSeats = new Set(cleanedSeats);
  if (uniqueSeats.size !== cleanedSeats.length) {
    return {
      valid: false,
      message: 'Duplicate seats detected in the reservation request.',
    };
  }

  return { valid: true, cleanedSeats };
};

/**
 * Validates showtime and verifies consistency with movie, theatre, and date if supplied
 * @param {Object} params
 * @returns {Promise<{ valid: boolean, message?: string, showtime?: Object }>}
 */
const validateShowtimeConsistency = async ({
  showtimeId,
  movieId,
  theatreId,
  date,
}) => {
  if (!showtimeId || !mongoose.Types.ObjectId.isValid(showtimeId)) {
    return { valid: false, message: 'Invalid or missing showtime ID.' };
  }

  const showtime = await Showtime.findById(showtimeId)
    .populate('movie', 'title slug certification formats')
    .populate('theatre', 'name slug city location');

  if (!showtime) {
    return { valid: false, message: 'Showtime not found.' };
  }

  if (showtime.status === 'sold_out') {
    return { valid: false, message: 'This showtime is completely sold out.' };
  }

  // Validate movie reference if provided (supports ObjectId or slug)
  if (movieId) {
    const movieMatches =
      showtime.movie._id.toString() === movieId.toString() ||
      showtime.movie.slug === movieId.toString().toLowerCase();
    if (!movieMatches) {
      return {
        valid: false,
        message: 'The requested showtime does not belong to the specified movie.',
      };
    }
  }

  // Validate theatre reference if provided (supports ObjectId or slug)
  if (theatreId) {
    const theatreMatches =
      showtime.theatre._id.toString() === theatreId.toString() ||
      showtime.theatre.slug === theatreId.toString().toLowerCase();
    if (!theatreMatches) {
      return {
        valid: false,
        message: 'The requested showtime does not belong to the specified theatre.',
      };
    }
  }

  // Validate date if provided
  if (date && typeof date === 'string' && showtime.date !== date.trim()) {
    return {
      valid: false,
      message: `The requested showtime is scheduled for ${showtime.date}, but date ${date} was requested.`,
    };
  }

  return { valid: true, showtime };
};

/**
 * Atomically reserves seats on a showtime document in MongoDB.
 * Concurrency safety: Uses $nin condition to guarantee that none of the requested seats
 * are already present in bookedSeats.
 *
 * @param {string|mongoose.Types.ObjectId} showtimeId
 * @param {Array<string>} seats
 * @returns {Promise<{ success: boolean, showtime?: Object, error?: string, conflictingSeats?: string[] }>}
 */
const reserveSeatsAtomic = async (showtimeId, seats) => {
  // 1. Check current booked seats for specific conflict diagnostic
  const currentShow = await Showtime.findById(showtimeId).select('bookedSeats totalSeats');
  if (!currentShow) {
    return { success: false, error: 'Showtime does not exist.' };
  }

  const alreadyBooked = seats.filter((s) => currentShow.bookedSeats.includes(s));
  if (alreadyBooked.length > 0) {
    return {
      success: false,
      error: `Seats [${alreadyBooked.join(', ')}] are already booked.`,
      conflictingSeats: alreadyBooked,
    };
  }

  // Check capacity
  if (currentShow.bookedSeats.length + seats.length > currentShow.totalSeats) {
    return {
      success: false,
      error: 'Selecting these seats exceeds screen total capacity.',
    };
  }

  // 2. Perform atomic conditional push
  const updatedShowtime = await Showtime.findOneAndUpdate(
    {
      _id: showtimeId,
      bookedSeats: { $nin: seats }, // Atomic guard: NONE of the seats can be in bookedSeats
    },
    {
      $push: { bookedSeats: { $each: seats } },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedShowtime) {
    // A race condition occurred where another request booked one of the seats concurrently
    const refreshedShow = await Showtime.findById(showtimeId).select('bookedSeats');
    const freshConflicts = seats.filter((s) => refreshedShow?.bookedSeats.includes(s));
    return {
      success: false,
      error:
        freshConflicts.length > 0
          ? `Seats [${freshConflicts.join(', ')}] were just reserved by another customer.`
          : 'Failed to reserve seats due to a concurrent reservation conflict. Please try again.',
      conflictingSeats: freshConflicts,
    };
  }

  // Automatically update status if almost full or sold out
  const remaining = updatedShowtime.totalSeats - updatedShowtime.bookedSeats.length;
  if (remaining <= 0 && updatedShowtime.status !== 'sold_out') {
    await Showtime.updateOne({ _id: showtimeId }, { $set: { status: 'sold_out' } });
  } else if (remaining <= 10 && updatedShowtime.status === 'available') {
    await Showtime.updateOne({ _id: showtimeId }, { $set: { status: 'almost_full' } });
  }

  return { success: true, showtime: updatedShowtime };
};

/**
 * Safely releases previously reserved seats (used for rollback or cancellation)
 * @param {string|mongoose.Types.ObjectId} showtimeId
 * @param {Array<string>} seats
 * @returns {Promise<{ success: boolean, showtime?: Object }>}
 */
const releaseSeatsAtomic = async (showtimeId, seats) => {
  if (!Array.isArray(seats) || seats.length === 0) {
    return { success: true };
  }

  const updatedShowtime = await Showtime.findByIdAndUpdate(
    showtimeId,
    {
      $pull: { bookedSeats: { $in: seats } },
    },
    { new: true }
  );

  if (updatedShowtime) {
    // If it was sold_out or almost_full, restore availability status
    const remaining = updatedShowtime.totalSeats - updatedShowtime.bookedSeats.length;
    if (remaining > 15 && updatedShowtime.status !== 'available') {
      await Showtime.updateOne({ _id: showtimeId }, { $set: { status: 'available' } });
    }
  }

  return { success: true, showtime: updatedShowtime };
};

/**
 * Computes price breakdown (ticket base fare, convenience fee, GST, total)
 * @param {number} ticketPrice
 * @param {number} seatCount
 * @returns {{ subtotal: number, convenienceFee: number, gst: number, totalAmount: number }}
 */
const calculatePricing = (ticketPrice, seatCount) => {
  const price = typeof ticketPrice === 'number' && ticketPrice > 0 ? ticketPrice : 180;
  const count = typeof seatCount === 'number' && seatCount > 0 ? seatCount : 1;

  const subtotal = price * count;
  const convenienceFee = count * 25; // ₹25 convenience fee per seat
  const gst = Math.round(convenienceFee * 0.18); // 18% GST on convenience fee
  const totalAmount = subtotal + convenienceFee + gst;

  return { subtotal, convenienceFee, gst, totalAmount };
};

/**
 * Orchestrates a complete seat reservation & booking flow with rollback guarantee.
 *
 * Steps:
 * 1. Validates user, showtime, movie, theatre, date, and seats.
 * 2. Atomically reserves the seats in Showtime.bookedSeats.
 * 3. Attempts to create the Booking record.
 * 4. IF Booking creation fails, automatically rolls back by releasing the reserved seats.
 *
 * @param {Object} bookingData
 * @returns {Promise<{ success: boolean, booking?: Object, error?: string, statusCode?: number }>}
 */
const createReservation = async ({
  userId,
  showtimeId,
  movieId,
  theatreId,
  date,
  seats,
  paymentMethod,
}) => {
  // 1. Validate User
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return { success: false, error: 'A valid User ID is required.', statusCode: 400 };
  }

  // 2. Validate Seat Selection
  const seatValidation = validateSeatSelection(seats);
  if (!seatValidation.valid) {
    return { success: false, error: seatValidation.message, statusCode: 400 };
  }
  const cleanedSeats = seatValidation.cleanedSeats;

  // 3. Validate Showtime Consistency
  const showtimeValidation = await validateShowtimeConsistency({
    showtimeId,
    movieId,
    theatreId,
    date,
  });
  if (!showtimeValidation.valid) {
    return { success: false, error: showtimeValidation.message, statusCode: 400 };
  }
  const showtimeDoc = showtimeValidation.showtime;

  // 4. Atomic Seat Reservation
  const reservationResult = await reserveSeatsAtomic(showtimeDoc._id, cleanedSeats);
  if (!reservationResult.success) {
    return {
      success: false,
      error: reservationResult.error,
      conflictingSeats: reservationResult.conflictingSeats,
      statusCode: 409, // Conflict
    };
  }

  // 5. Calculate Pricing
  const { subtotal, convenienceFee, gst, totalAmount } = calculatePricing(
    showtimeDoc.price,
    cleanedSeats.length
  );

  // 6. Attempt Booking Document Creation with Rollback Guard
  try {
    const booking = await Booking.create({
      user: userId,
      movie: showtimeDoc.movie._id,
      theatre: showtimeDoc.theatre._id,
      showtime: showtimeDoc._id,
      showDate: showtimeDoc.date,
      showTime: showtimeDoc.time,
      format: showtimeDoc.format,
      seats: cleanedSeats,
      seatCount: cleanedSeats.length,
      subtotal,
      convenienceFee,
      gst,
      totalAmount,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: paymentMethod || 'Demo Payment Pending',
    });

    return {
      success: true,
      booking,
      showtime: reservationResult.showtime,
    };
  } catch (bookingError) {
    // CRITICAL ROLLBACK: If booking creation fails, immediately release the reserved seats
    console.error(
      `[BookingService] Error creating Booking record. Rolling back seats ${JSON.stringify(cleanedSeats)}:`,
      bookingError.message
    );
    await releaseSeatsAtomic(showtimeDoc._id, cleanedSeats);

    return {
      success: false,
      error: `Booking creation failed: ${bookingError.message}. Seats have been released.`,
      statusCode: 500,
    };
  }
};

/**
 * Processes a demo payment simulation for a pending booking.
 * Strictly verifies ownership, valid pending state, prevents duplicate payment.
 *
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.bookingId
 * @param {string|mongoose.Types.ObjectId} params.userId
 * @param {'success'|'failure'|'cancelled'} params.simulateStatus
 * @param {string} [params.paymentMethod]
 * @returns {Promise<{ success: boolean, booking?: Object, error?: string, statusCode?: number, isDemoFailure?: boolean, isDemoCancelled?: boolean }>}
 */
const processDemoPayment = async ({
  bookingId,
  userId,
  simulateStatus,
  paymentMethod,
}) => {
  if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
    return { success: false, error: 'Valid booking ID is required.', statusCode: 400 };
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return { success: false, error: 'Booking reservation not found.', statusCode: 404 };
  }

  // Strict ownership check: user must own this booking
  if (booking.user.toString() !== userId.toString()) {
    return {
      success: false,
      error: 'Unauthorized: You can only process demo payment for your own booking.',
      statusCode: 403,
    };
  }

  // Idempotency & duplicate submission prevention:
  if (booking.status === 'confirmed' && booking.paymentStatus === 'paid') {
    return {
      success: false,
      error: 'This booking has already been paid and confirmed. Duplicate submission blocked.',
      statusCode: 400,
    };
  }

  if (booking.status === 'cancelled') {
    return {
      success: false,
      error: 'This booking has been cancelled and cannot be paid.',
      statusCode: 400,
    };
  }

  // Normalize demo payment method label
  const validMethods = [
    'Demo UPI (Simulated)',
    'Demo Card (Simulated)',
    'Demo Skill Wallet (Simulated)',
    'Demo Net Banking (Simulated)',
  ];
  const chosenMethod = validMethods.includes(paymentMethod)
    ? paymentMethod
    : paymentMethod || 'Demo Online Payment (Simulated)';

  // Handle Simulation Scenarios:
  if (simulateStatus === 'success') {
    booking.status = 'confirmed';
    booking.paymentStatus = 'paid';
    booking.paymentMethod = chosenMethod;
    booking.demoTransactionId = `DEMO-TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    booking.paidAt = new Date();
    booking.failureReason = '';

    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate('movie', 'title slug certification formats poster posterUrl accentColor duration')
      .populate('theatre', 'name slug city location badge facilities')
      .populate('showtime', 'date time format price status')
      .populate('user', 'name email');

    return {
      success: true,
      booking: populated || booking,
    };
  }

  if (simulateStatus === 'failure') {
    booking.status = 'cancelled';
    booking.paymentStatus = 'failed';
    booking.paymentMethod = chosenMethod;
    booking.failureReason = 'User simulated payment failure in demo mode.';
    await booking.save();

    // Release reserved seats back to the showtime atomically
    await releaseSeatsAtomic(booking.showtime, booking.seats);

    const populated = await Booking.findById(booking._id)
      .populate('movie', 'title slug certification formats poster posterUrl accentColor duration')
      .populate('theatre', 'name slug city location badge facilities');

    return {
      success: false,
      isDemoFailure: true,
      error: 'Demo payment simulated failure. Booking cancelled and seats released.',
      booking: populated || booking,
      statusCode: 200,
    };
  }

  if (simulateStatus === 'cancelled') {
    booking.status = 'cancelled';
    booking.paymentStatus = 'failed';
    booking.paymentMethod = chosenMethod;
    booking.failureReason = 'User cancelled demo payment session.';
    await booking.save();

    // Release reserved seats back to the showtime atomically
    await releaseSeatsAtomic(booking.showtime, booking.seats);

    return {
      success: false,
      isDemoCancelled: true,
      error: 'Demo payment cancelled by user. Seats released.',
      booking,
      statusCode: 200,
    };
  }

  return {
    success: false,
    error: `Invalid simulateStatus: "${simulateStatus}". Must be 'success', 'failure', or 'cancelled'.`,
    statusCode: 400,
  };
};

/**
 * Cancels a booking reservation directly and releases seats if active
 */
const cancelReservation = async ({ bookingId, userId, reason = 'User requested cancellation' }) => {
  if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
    return { success: false, error: 'Valid booking ID is required.', statusCode: 400 };
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return { success: false, error: 'Booking not found.', statusCode: 404 };
  }

  if (booking.user.toString() !== userId.toString()) {
    return {
      success: false,
      error: 'Unauthorized: You can only cancel your own booking.',
      statusCode: 403,
    };
  }

  if (booking.status === 'cancelled') {
    return {
      success: false,
      error: 'This booking has already been cancelled.',
      statusCode: 400,
    };
  }

  const previousStatus = booking.status;
  booking.status = 'cancelled';
  if (booking.paymentStatus === 'paid') {
    booking.paymentStatus = 'refunded';
  } else {
    booking.paymentStatus = 'failed';
  }
  booking.failureReason = reason;
  await booking.save();

  // Atomically release seats if they were held
  await releaseSeatsAtomic(booking.showtime, booking.seats);

  return { success: true, booking, previousStatus };
};

module.exports = {
  validateSeatSelection,
  validateShowtimeConsistency,
  reserveSeatsAtomic,
  releaseSeatsAtomic,
  calculatePricing,
  createReservation,
  processDemoPayment,
  cancelReservation,
};
