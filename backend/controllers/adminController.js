const Booking = require('../models/Booking');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Showtime = require('../models/Showtime');

/**
 * @desc    Get aggregated cinema administration statistics & metrics
 * @route   GET /api/admin/stats
 * @access  Private (Admin only)
 */
const getAdminStats = async (req, res, next) => {
  try {
    // 1. Booking counts by status
    const totalBookings = await Booking.countDocuments();
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });

    // 2. Aggregate confirmed tickets sold and simulated demo revenue
    const confirmedDocs = await Booking.find(
      { status: 'confirmed' },
      'seatCount totalAmount paymentStatus'
    ).lean();

    const ticketsSold = confirmedDocs.reduce((acc, b) => acc + (b.seatCount || 0), 0);

    // Only count demo revenue from paid & confirmed bookings
    const paidDocs = confirmedDocs.filter((b) => b.paymentStatus === 'paid');
    const totalDemoRevenue = paidDocs.reduce((acc, b) => acc + (b.totalAmount || 0), 0);

    // 3. Catalog counts
    const totalMovies = await Movie.countDocuments();
    const nowShowingMovies = await Movie.countDocuments({ status: 'now_showing' });
    const upcomingMovies = await Movie.countDocuments({ status: 'upcoming' });
    const totalTheatres = await Theatre.countDocuments();
    const totalShowtimes = await Showtime.countDocuments();

    // 4. Recent booking activity (limited to 8, excluding sensitive payment/user details)
    const recentBookings = await Booking.find({}, 'bookingRef movie theatre seats seatCount totalAmount status paymentStatus showDate showTime createdAt')
      .populate('movie', 'title certification formats poster')
      .populate('theatre', 'name city location')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Admin statistics retrieved successfully',
      data: {
        bookings: {
          total: totalBookings,
          confirmed: confirmedBookings,
          cancelled: cancelledBookings,
          pending: pendingBookings,
          ticketsSold,
        },
        financials: {
          totalDemoRevenue,
          currency: 'INR (₹)',
          isSimulated: true,
          label: 'Simulated Demo Payment Total',
          notice:
            'All payment totals are simulated for demonstration purposes only. No real banking or currency transactions occur.',
        },
        catalog: {
          totalMovies,
          nowShowing: nowShowingMovies,
          upcoming: upcomingMovies,
          theatres: totalTheatres,
          showtimes: totalShowtimes,
        },
        recentBookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
};
