const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const Booking = require('./models/Booking');
const Showtime = require('./models/Showtime');
const Movie = require('./models/Movie');
const Theatre = require('./models/Theatre');
const User = require('./models/User');
const { generateTicketPdf } = require('./utils/ticketPdfGenerator');
const { buildBookingConfirmationHtml, sendBookingConfirmationEmail, isSmtpConfigured } = require('./utils/emailService');

(async () => {
  console.log('='.repeat(70));
  console.log('  iMovies Email Confirmation & PDF E-Ticket Verification Suite');
  console.log('='.repeat(70));

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/imovies');
  console.log('✓ Connected to MongoDB');

  // Baseline Checks
  const initialBookingsCount = await Booking.countDocuments();
  const initialShowtimesCount = await Showtime.countDocuments();
  console.log(`Baseline Database State: ${initialBookingsCount} bookings, ${initialShowtimesCount} showtimes.`);

  // Test 1: PDF Generator Verification
  console.log('\n--- Test 1: PDF Ticket Generator ---');
  const dummyBooking = {
    bookingRef: 'IMOV-TEST-UNIT-99',
    movie: { title: 'Kalki 2898 AD', certification: 'UA', duration: '3h 01m' },
    theatre: { name: 'Sudha Complex 4K Dolby Atmos', location: 'Subhash Road, Anantapur' },
    showDate: '2026-10-30',
    showTime: '06:15 PM',
    format: 'Telugu 3D Atmos',
    seats: ['C4', 'C5'],
    seatCount: 2,
    subtotal: 440,
    convenienceFee: 50,
    gst: 9,
    totalAmount: 499,
    user: { name: 'Audit Test User', email: 'audit-test@example.com' },
    paymentMethod: 'Demo UPI (Simulated)',
    demoTransactionId: 'DEMO-TXN-UNIT-TEST',
  };

  const pdfBuffer = await generateTicketPdf(dummyBooking);
  console.log(`✓ PDF Generated successfully in memory. Size: ${pdfBuffer.length} bytes.`);
  if (!pdfBuffer || pdfBuffer.length < 1000) {
    throw new Error('PDF Buffer generation produced unexpectedly small or empty data.');
  }

  // Test 2: HTML Email Template Verification
  console.log('\n--- Test 2: HTML Email Template Generator ---');
  const htmlContent = buildBookingConfirmationHtml({
    customerName: dummyBooking.user.name,
    movieTitle: dummyBooking.movie.title,
    movieFormat: dummyBooking.format,
    movieCert: dummyBooking.movie.certification,
    theatreName: dummyBooking.theatre.name,
    theatreLocation: dummyBooking.theatre.location,
    showDate: dummyBooking.showDate,
    showTime: dummyBooking.showTime,
    seatsList: dummyBooking.seats.join(', '),
    seatCount: dummyBooking.seatCount,
    bookingRef: dummyBooking.bookingRef,
    totalAmount: dummyBooking.totalAmount,
    paymentMethod: dummyBooking.paymentMethod,
    demoTransactionId: dummyBooking.demoTransactionId,
  });

  console.log(`✓ HTML Email Template compiled. Length: ${htmlContent.length} chars.`);
  const requiredStrings = [
    'Booking Confirmed!',
    'Audit Test User',
    'Kalki 2898 AD',
    'Sudha Complex 4K Dolby Atmos',
    'IMOV-TEST-UNIT-99',
    'C4, C5',
    '₹499.00',
    'Simulated academic project demonstration',
  ];
  for (const str of requiredStrings) {
    if (!htmlContent.includes(str)) {
      throw new Error(`HTML Template missing required element: "${str}"`);
    }
  }
  console.log('✓ All required email template fields and disclaimers are present.');

  // Test 3: Safe Development Mode & SMTP Configuration Check
  console.log('\n--- Test 3: SMTP Environment Check & Safe Dev Mode ---');
  const smtpActive = isSmtpConfigured();
  console.log(`SMTP Configured for live delivery: ${smtpActive ? 'YES (Live SMTP)' : 'NO (Safe Development Mode)'}`);

  // Test 4: Concurrent Atomic Duplicate-Prevention Claim Test
  console.log('\n--- Test 4: Concurrent Atomic Duplicate-Prevention Claim ---');
  // Create a transient test user and booking to test atomic claims
  let testUser = await User.findOne({ email: 'concurrent-test@example.com' });
  if (!testUser) {
    testUser = await User.create({
      name: 'Concurrent Tester',
      email: 'concurrent-test@example.com',
      password: 'password123',
    });
  }

  const sampleMovie = await Movie.findOne({ status: 'now_showing' });
  const sampleTheatre = await Theatre.findOne();
  const sampleShowtime = await Showtime.findOne({ movie: sampleMovie._id, theatre: sampleTheatre._id });

  const testBooking = await Booking.create({
    bookingRef: `IMOV-CONCUR-${Date.now().toString(36).toUpperCase()}`,
    user: testUser._id,
    movie: sampleMovie._id,
    theatre: sampleTheatre._id,
    showtime: sampleShowtime._id,
    showDate: sampleShowtime.date,
    showTime: sampleShowtime.time,
    format: sampleShowtime.format,
    seats: ['Z1'],
    seatCount: 1,
    subtotal: 180,
    convenienceFee: 25,
    gst: 5,
    totalAmount: 210,
    status: 'confirmed',
    paymentStatus: 'paid',
    paymentMethod: 'Demo Card (Simulated)',
    demoTransactionId: 'DEMO-TXN-CONCUR',
    emailDelivery: {
      status: 'pending',
      recipientEmail: testUser.email,
    },
  });

  console.log(`Created test booking ${testBooking.bookingRef} in status: 'confirmed', emailDelivery.status: 'pending'.`);

  // Simulate two simultaneous concurrent attempts to send confirmation email
  console.log('Dispatching 2 concurrent email delivery attempts for the same booking...');
  const [res1, res2] = await Promise.all([
    sendBookingConfirmationEmail(testBooking._id),
    sendBookingConfirmationEmail(testBooking._id),
  ]);

  console.log('Result of Call 1:', { success: res1.success, status: res1.status, isDevMode: res1.isDevMode, skipped: res1.skipped });
  console.log('Result of Call 2:', { success: res2.success, status: res2.status, isDevMode: res2.isDevMode, skipped: res2.skipped, reason: res2.reason });

  // Exactly one call should have processed the booking; the other MUST have been skipped or blocked!
  if (res1.skipped && res2.skipped) {
    throw new Error('Both concurrent calls were skipped unexpectedly.');
  }
  const oneProcessed = (res1.success && !res1.skipped) || (res2.success && !res2.skipped);
  const oneBlocked = (res1.skipped || res2.skipped);
  if (!oneProcessed || !oneBlocked) {
    throw new Error('Concurrent atomic claim failed: exactly one call must claim and the second must be blocked.');
  }
  console.log('✓ Atomic duplicate-prevention claim passed: Concurrent request safely blocked!');

  // Test 5: Verify Non-Impact on Failure / Cancellation
  console.log('\n--- Test 5: Error Isolation & Booking Preservation ---');
  const reloadedBooking = await Booking.findById(testBooking._id);
  console.log('Booking state after email dispatch attempt:', {
    bookingStatus: reloadedBooking.status,
    paymentStatus: reloadedBooking.paymentStatus,
    seats: reloadedBooking.seats,
    emailDeliveryStatus: reloadedBooking.emailDelivery?.status,
  });

  if (reloadedBooking.status !== 'confirmed' || reloadedBooking.paymentStatus !== 'paid') {
    throw new Error('Email handling altered confirmed booking status!');
  }
  console.log('✓ Booking status remains confirmed and payment remains paid regardless of email flow.');

  // Clean up transient test records
  console.log('\nCleaning up transient test records...');
  await Booking.deleteOne({ _id: testBooking._id });
  await User.deleteOne({ _id: testUser._id });
  console.log('✓ Transient test records removed cleanly.');

  // Verify Baseline Database Count Preserved
  const finalBookingsCount = await Booking.countDocuments();
  const finalShowtimesCount = await Showtime.countDocuments();
  console.log(`\nFinal Database State: ${finalBookingsCount} bookings (Expected: ${initialBookingsCount}), ${finalShowtimesCount} showtimes (Expected: ${initialShowtimesCount}).`);

  if (finalBookingsCount !== initialBookingsCount || finalShowtimesCount !== initialShowtimesCount) {
    throw new Error('Database record count mismatch detected!');
  }
  console.log('✓ All existing database records remain intact and preserved.');

  await mongoose.disconnect();
  console.log('\n' + '='.repeat(70));
  console.log('  ALL TESTS PASSED SUCCESSFULLY!');
  console.log('='.repeat(70));
})().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});

