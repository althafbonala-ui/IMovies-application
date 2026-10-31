const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const Booking = require('./models/Booking');
const Showtime = require('./models/Showtime');
const Movie = require('./models/Movie');
const Theatre = require('./models/Theatre');
const User = require('./models/User');
const { createReservation, processDemoPayment } = require('./services/bookingService');
const { sendBookingConfirmationEmail } = require('./utils/emailService');

(async () => {
  console.log('--- Testing Payment Simulation Scenarios (Success vs Failure) ---');
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/imovies');

  const user = await User.findOne();
  const movie = await Movie.findOne({ status: 'now_showing' });
  const theatre = await Theatre.findOne();
  const showtime = await Showtime.findOne({ movie: movie._id, theatre: theatre._id, date: '2026-10-30' });

  // SCENARIO 1: Success Flow
  console.log('\n[Scenario 1: Demo Payment SUCCESS]');
  const resSuccess = await createReservation({
    userId: user._id,
    showtimeId: showtime._id,
    movieId: movie._id,
    theatreId: theatre._id,
    date: showtime.date,
    seats: ['F1', 'F2'],
    paymentMethod: 'Demo UPI (Simulated)',
  });

  console.log('Reservation 1 created:', resSuccess.booking.bookingRef, 'Status:', resSuccess.booking.status);

  // Process success
  const paySuccess = await processDemoPayment({
    bookingId: resSuccess.booking._id,
    userId: user._id,
    simulateStatus: 'success',
    paymentMethod: 'Demo UPI (Simulated)',
  });

  console.log('Payment Success Result:', {
    success: paySuccess.success,
    bookingStatus: paySuccess.booking.status,
    paymentStatus: paySuccess.booking.paymentStatus,
    userPopulated: Boolean(paySuccess.booking.user?.email),
  });

  // Dispatch email
  const emailRes = await sendBookingConfirmationEmail(paySuccess.booking._id);
  console.log('Email Dispatch Result:', emailRes);

  const updatedSuccessBooking = await Booking.findById(paySuccess.booking._id);
  console.log('Final Booking Email Delivery State:', updatedSuccessBooking.emailDelivery);

  // SCENARIO 2: Failure Flow
  console.log('\n[Scenario 2: Demo Payment FAILURE]');
  const resFail = await createReservation({
    userId: user._id,
    showtimeId: showtime._id,
    movieId: movie._id,
    theatreId: theatre._id,
    date: showtime.date,
    seats: ['F3', 'F4'],
    paymentMethod: 'Demo Card (Simulated)',
  });

  console.log('Reservation 2 created:', resFail.booking.bookingRef, 'Status:', resFail.booking.status);

  // Process failure
  const payFail = await processDemoPayment({
    bookingId: resFail.booking._id,
    userId: user._id,
    simulateStatus: 'failure',
    paymentMethod: 'Demo Card (Simulated)',
  });

  console.log('Payment Failure Result:', {
    success: payFail.success,
    isDemoFailure: payFail.isDemoFailure,
    bookingStatus: payFail.booking.status,
    paymentStatus: payFail.booking.paymentStatus,
  });

  // Verify email is NOT sent for failed booking
  const emailFailAttempt = await sendBookingConfirmationEmail(payFail.booking._id);
  console.log('Email Dispatch on Failed Booking (Must be skipped):', emailFailAttempt);

  if (emailFailAttempt.status === 'sent' || !emailFailAttempt.skipped) {
    throw new Error('Email was dispatched for an unconfirmed / failed booking!');
  }
  console.log('✓ Verified: Confirmation emails are strictly blocked for failed payments.');

  // Clean up reservations
  console.log('\nCleaning up scenario test bookings and releasing seats...');
  const ShowtimeModel = require('./models/Showtime');
  await ShowtimeModel.updateOne(
    { _id: showtime._id },
    { $pull: { bookedSeats: { $in: ['F1', 'F2', 'F3', 'F4'] } } }
  );
  await Booking.deleteOne({ _id: resSuccess.booking._id });
  await Booking.deleteOne({ _id: resFail.booking._id });
  console.log('✓ Seats released and test bookings removed.');

  await mongoose.disconnect();
  console.log('✓ All payment scenario tests completed successfully!');
})().catch(err => {
  console.error('Scenario test error:', err);
  process.exit(1);
});

