import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMyBookings } from '../services/bookingService';
import { getBannerPlaceholder } from '../data/mockMovies';
import BookingDetailsModal from '../components/BookingDetailsModal';

/**
 * MyBookingsPage Component
 *
 * Responsive, authenticated cinema booking history page.
 * Fetches real bookings from GET /api/bookings/my via Axios bookingService.
 *
 * Props:
 * - user {object|null}: Authenticated user state from App.jsx
 * - authLoading {boolean}: Flag indicating if session verification is in progress
 * - onOpenAuthModal {function}: Callback to trigger login / signup modal
 * - showToast {function}: Toast notification dispatcher
 * - selectedCity {object}: Current cinema city location
 */
function MyBookingsPage({
  user,
  authLoading = false,
  onOpenAuthModal,
  showToast,
  selectedCity,
}) {
  const navigate = useNavigate();
  const { id: routeBookingId } = useParams();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'confirmed' | 'pending' | 'cancelled'
  const [filterSearch, setFilterSearch] = useState('');
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Fetch live booking history for authenticated user
  const fetchBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const response = await getMyBookings();
      if (response && response.success && Array.isArray(response.data)) {
        setBookings(response.data);
      } else {
        setBookings([]);
      }
    } catch (err) {
      const status = err.response?.status;
      let msg = err.response?.data?.message || 'Unable to retrieve your booking history.';
      if (status === 401) {
        msg = 'Your session has expired. Please sign in again to view your bookings.';
      } else if (!err.response) {
        msg = 'Network connection error. Please verify your internet and backend server connectivity.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load bookings on mount or when user changes
  useEffect(() => {
    if (user) {
      fetchBookings();
    } else {
      setBookings([]);
      setLoading(false);
      setError(null);
    }
  }, [user, fetchBookings]);

  // Handle route-level deep linking to a specific booking ID (/bookings/:id)
  useEffect(() => {
    if (routeBookingId) {
      // Find if already in loaded bookings
      const existing = bookings.find((b) => b._id === routeBookingId);
      if (existing) {
        setSelectedBookingForDetails(existing);
      } else {
        // Pass ID directly to modal to fetch via getBookingById
        setSelectedBookingForDetails({ _id: routeBookingId });
      }
      setDetailsModalOpen(true);
    }
  }, [routeBookingId, bookings]);

  // Quick copy reference handler
  const handleCopyRef = (e, ref, id) => {
    e.stopPropagation();
    if (!ref) return;
    try {
      navigator.clipboard.writeText(ref);
      setCopiedId(id);
      if (showToast) {
        showToast('info', 'Reference Copied', `Booking reference ${ref} copied to clipboard!`, '📋');
      }
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Open booking details modal
  const handleViewDetails = (booking) => {
    setSelectedBookingForDetails(booking);
    setDetailsModalOpen(true);
  };

  // Close details modal
  const handleCloseDetails = () => {
    setDetailsModalOpen(false);
    setSelectedBookingForDetails(null);
    if (routeBookingId) {
      navigate('/my-bookings', { replace: true });
    }
  };

  // Handler when a booking is successfully cancelled from inside details modal
  const handleBookingCancelled = useCallback(
    (cancelledBooking) => {
      fetchBookings();
      if (cancelledBooking) {
        setSelectedBookingForDetails((prev) =>
          prev && prev._id === cancelledBooking._id ? cancelledBooking : prev
        );
      }
    },
    [fetchBookings]
  );

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Filtered bookings calculation
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Status filter
      if (activeFilter === 'confirmed' && b.status !== 'confirmed') return false;
      if (activeFilter === 'pending' && b.status !== 'pending') return false;
      if (activeFilter === 'cancelled' && b.status !== 'cancelled') return false;

      // Text search inside bookings
      if (filterSearch.trim() !== '') {
        const query = filterSearch.toLowerCase().trim();
        const titleMatch = b.movie?.title?.toLowerCase().includes(query);
        const refMatch = b.bookingRef?.toLowerCase().includes(query);
        const theatreMatch = b.theatre?.name?.toLowerCase().includes(query);
        const seatMatch = Array.isArray(b.seats) && b.seats.some((s) => s.toLowerCase().includes(query));
        return titleMatch || refMatch || theatreMatch || seatMatch;
      }

      return true;
    });
  }, [bookings, activeFilter, filterSearch]);

  // Counts for tabs
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;

  return (
    <div className="my-bookings-page py-4 py-md-5">
      <div className="container">
        {/* Breadcrumb Navigation */}
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb small mb-0">
            <li className="breadcrumb-item">
              <button
                type="button"
                className="btn btn-link p-0 text-secondary text-decoration-none small border-0 bg-transparent"
                onClick={() => navigate('/')}
              >
                Home
              </button>
            </li>
            <li className="breadcrumb-item active text-danger fw-semibold" aria-current="page">
              My Bookings
            </li>
          </ol>
        </nav>

        {/* Page Hero Header */}
        <div
          className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 p-4 rounded-4 mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(14, 21, 38, 0.9) 0%, rgba(20, 29, 52, 0.7) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span style={{ fontSize: '1.6rem' }} aria-hidden="true">🎟️</span>
              <h1 className="h3 fw-bold text-white mb-0 brand-font">
                My Cinema Bookings & E-Tickets
              </h1>
              {bookings.length > 0 && (
                <span className="badge bg-danger rounded-pill px-2 py-1 small">
                  {bookings.length} {bookings.length === 1 ? 'Booking' : 'Bookings'}
                </span>
              )}
            </div>
            <p className="text-secondary small mb-0" style={{ maxWidth: '580px' }}>
              View your confirmed movie reservations, seat assignments, and digital passes across partner cinemas in{' '}
              <strong className="text-white">{selectedCity?.name || 'Anantapur'}</strong>.
            </p>
          </div>

          {user && (
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button
                type="button"
                className="btn btn-sm btn-outline-light d-flex align-items-center gap-2 py-2 px-3 rounded-pill"
                onClick={fetchBookings}
                disabled={loading}
                title="Refresh booking history"
              >
                <span className={loading ? 'spinner-border spinner-border-sm' : ''} aria-hidden="true">
                  {!loading && '🔄'}
                </span>
                <span>Refresh</span>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-bms-primary py-2 px-3 rounded-pill d-flex align-items-center gap-2"
                onClick={() => {
                  navigate('/');
                  setTimeout(() => {
                    const el = document.getElementById('now-showing');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 80);
                }}
              >
                <span>🎬</span>
                <span>Book More Tickets</span>
              </button>
            </div>
          )}
        </div>

        {/* 1. STATE: Session Verification In-Progress */}
        {authLoading && (
          <div className="text-center py-5">
            <div className="spinner-border text-danger mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Checking authentication...</span>
            </div>
            <h5 className="text-white fw-bold mb-1">Verifying Your Session</h5>
            <p className="text-secondary small">Connecting securely to iMovies services...</p>
          </div>
        )}

        {/* 2. STATE: Signed Out */}
        {!authLoading && !user && (
          <div
            className="text-center p-4 p-md-5 rounded-4 mx-auto my-3"
            style={{
              maxWidth: '560px',
              background: 'rgba(14, 21, 38, 0.85)',
              border: '1px solid rgba(248, 68, 100, 0.3)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div
              className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
              style={{
                width: '72px',
                height: '72px',
                background: 'linear-gradient(135deg, rgba(248, 68, 100, 0.2) 0%, rgba(178, 16, 50, 0.3) 100%)',
                border: '1px solid rgba(248, 68, 100, 0.4)',
              }}
            >
              <span style={{ fontSize: '2.2rem' }} aria-hidden="true">🔒</span>
            </div>
            <h3 className="h4 fw-bold text-white mb-2 brand-font">
              Sign In to View Your Bookings
            </h3>
            <p className="text-secondary small mb-4" style={{ lineHeight: '1.6' }}>
              Your cinema e-tickets, seat numbers, and reservation history are securely stored in your personal account.
              Please sign in or register to unlock your bookings.
            </p>
            <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
              <button
                type="button"
                className="btn btn-bms-primary py-2 px-4 rounded-pill d-flex align-items-center justify-content-center gap-2"
                onClick={onOpenAuthModal}
              >
                <span>🔑</span>
                <span>Sign In / Create Account</span>
              </button>
              <button
                type="button"
                className="btn btn-outline-light py-2 px-4 rounded-pill"
                onClick={() => navigate('/')}
              >
                Back to Movies
              </button>
            </div>
          </div>
        )}

        {/* 3. STATE: Error Loading Bookings */}
        {!authLoading && user && error && !loading && (
          <div
            className="p-4 rounded-4 mb-4 text-center mx-auto"
            style={{
              maxWidth: '620px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
            }}
          >
            <span style={{ fontSize: '2.5rem' }} aria-hidden="true">⚠️</span>
            <h4 className="h5 fw-bold text-white mt-2 mb-1">
              Unable to Load Bookings
            </h4>
            <p className="text-danger small mb-3">{error}</p>
            <button
              type="button"
              className="btn btn-sm btn-outline-light px-3 py-1 rounded-pill"
              onClick={fetchBookings}
            >
              🔄 Try Again
            </button>
          </div>
        )}

        {/* 4. STATE: Loading Skeletons */}
        {!authLoading && user && loading && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="skeleton-placeholder" style={{ width: '180px', height: '24px', borderRadius: '6px' }} />
              <div className="skeleton-placeholder" style={{ width: '120px', height: '24px', borderRadius: '6px' }} />
            </div>
            <div className="row g-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="col-12 col-lg-6">
                  <div
                    className="p-4 rounded-4 position-relative overflow-hidden"
                    style={{
                      background: 'rgba(14, 21, 38, 0.65)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      minHeight: '220px',
                    }}
                  >
                    <div className="d-flex gap-3">
                      <div
                        className="skeleton-placeholder flex-shrink-0"
                        style={{ width: '80px', height: '120px', borderRadius: '8px' }}
                      />
                      <div className="flex-grow-1">
                        <div className="skeleton-placeholder mb-2" style={{ width: '60%', height: '20px', borderRadius: '4px' }} />
                        <div className="skeleton-placeholder mb-2" style={{ width: '40%', height: '14px', borderRadius: '4px' }} />
                        <div className="skeleton-placeholder mb-3" style={{ width: '80%', height: '14px', borderRadius: '4px' }} />
                        <div className="skeleton-placeholder" style={{ width: '30%', height: '24px', borderRadius: '12px' }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. STATE: Authenticated & Loaded */}
        {!authLoading && user && !loading && !error && (
          <>
            {/* Demo Mode Notice Banner */}
            <div
              className="p-3 rounded-4 mb-4 d-flex align-items-center gap-3 small"
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.22)',
                color: '#7dd3fc',
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>ℹ️</span>
              <div>
                <strong className="d-block text-white">Demo Payment Simulation Active:</strong>
                All bookings, payments, and ticket statuses are purely simulated for demonstration purposes. No real bank accounts or real money were charged.
              </div>
            </div>

            {/* Filter Pills & Search Bar (Only shown if user has bookings) */}
            {bookings.length > 0 && (
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                {/* Status Filter Tabs */}
                <div className="d-flex align-items-center gap-2 overflow-x-auto hide-scrollbar pb-1 pb-md-0">
                  <button
                    type="button"
                    className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('all')}
                  >
                    All ({bookings.length})
                  </button>
                  <button
                    type="button"
                    className={`filter-pill ${activeFilter === 'confirmed' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('confirmed')}
                  >
                    ✓ Confirmed ({confirmedCount})
                  </button>
                  {pendingCount > 0 && (
                    <button
                      type="button"
                      className={`filter-pill ${activeFilter === 'pending' ? 'active' : ''}`}
                      onClick={() => setActiveFilter('pending')}
                    >
                      ⏳ Pending ({pendingCount})
                    </button>
                  )}
                  {cancelledCount > 0 && (
                    <button
                      type="button"
                      className={`filter-pill ${activeFilter === 'cancelled' ? 'active' : ''}`}
                      onClick={() => setActiveFilter('cancelled')}
                    >
                      ✕ Cancelled ({cancelledCount})
                    </button>
                  )}
                </div>

                {/* Quick Search inside Bookings */}
                <div className="search-container" style={{ maxWidth: '320px', minWidth: '220px' }}>
                  <svg
                    className="search-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input
                    type="text"
                    className="search-input py-1"
                    placeholder="Search title, theatre, ref..."
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                    aria-label="Filter bookings"
                  />
                  {filterSearch && (
                    <button
                      type="button"
                      className="btn btn-sm text-secondary position-absolute end-0 top-50 translate-middle-y me-2 p-0 border-0"
                      onClick={() => setFilterSearch('')}
                      style={{ fontSize: '0.85rem' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 5A. Empty State: No bookings at all */}
            {bookings.length === 0 && (
              <div
                className="text-center p-5 rounded-4 mx-auto my-4"
                style={{
                  maxWidth: '560px',
                  background: 'rgba(14, 21, 38, 0.72)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div
                  className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                  style={{
                    width: '68px',
                    height: '68px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <span style={{ fontSize: '2rem' }} aria-hidden="true">🎬</span>
                </div>
                <h3 className="h4 fw-bold text-white mb-2 brand-font">
                  No Bookings Found Yet
                </h3>
                <p className="text-secondary small mb-4" style={{ lineHeight: '1.6' }}>
                  You haven't reserved any movie tickets yet. Explore trending Telugu, Hindi, and English blockbusters
                  playing across 4K Dolby Atmos screens in {selectedCity?.name || 'Anantapur'}!
                </p>
                <button
                  type="button"
                  className="btn btn-bms-primary py-2 px-4 rounded-pill d-inline-flex align-items-center gap-2"
                  onClick={() => {
                    navigate('/');
                    setTimeout(() => {
                      const el = document.getElementById('now-showing');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 80);
                  }}
                >
                  <span>🎟️</span>
                  <span>Explore Movies & Book Tickets</span>
                </button>
              </div>
            )}

            {/* 5B. Empty State: No matches for search/filter */}
            {bookings.length > 0 && filteredBookings.length === 0 && (
              <div
                className="text-center p-4 rounded-4 my-4"
                style={{
                  background: 'rgba(14, 21, 38, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <span style={{ fontSize: '2rem' }}>🔍</span>
                <h5 className="text-white fw-bold mt-2 mb-1">No Matching Bookings</h5>
                <p className="text-secondary small mb-3">
                  No bookings matched your filter criteria or search keyword "{filterSearch}".
                </p>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-light px-3"
                  onClick={() => {
                    setActiveFilter('all');
                    setFilterSearch('');
                  }}
                >
                  Reset Filters
                </button>
              </div>
            )}

            {/* 5C. Bookings Grid */}
            {filteredBookings.length > 0 && (
              <div className="row g-4">
                {filteredBookings.map((b) => {
                  const posterFallback = b.movie ? getBannerPlaceholder(b.movie) : '';
                  const posterSrc = b.movie?.posterUrl || b.movie?.poster || posterFallback;
                  const isConfirmed = b.status === 'confirmed';
                  const isPaid = b.paymentStatus === 'paid';

                  return (
                    <div key={b._id} className="col-12 col-lg-6">
                      <div
                        className="booking-ticket-card rounded-4 position-relative overflow-hidden h-100"
                        style={{
                          background: 'linear-gradient(145deg, #0e1526 0%, #0a0f1d 100%)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        }}
                      >
                        {/* Top Perforation Edge Notch Decorator */}
                        <div className="ticket-notch-top" aria-hidden="true" />
                        <div className="ticket-notch-bottom" aria-hidden="true" />

                        {/* Card Content Header Strip */}
                        <div
                          className="d-flex justify-content-between align-items-center p-3 px-4 border-bottom border-white border-opacity-10"
                          style={{ background: 'rgba(255, 255, 255, 0.02)' }}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <span className="text-secondary small" style={{ fontSize: '0.74rem' }}>
                              REF:
                            </span>
                            <strong className="text-white small fw-bold" style={{ letterSpacing: '0.04em' }}>
                              {b.bookingRef}
                            </strong>
                            <button
                              type="button"
                              className="btn btn-sm p-0 px-1 border-0 rounded text-secondary"
                              style={{ background: 'rgba(255,255,255,0.06)', fontSize: '0.7rem' }}
                              onClick={(e) => handleCopyRef(e, b.bookingRef, b._id)}
                              title="Copy Reference"
                              aria-label={`Copy reference ${b.bookingRef}`}
                            >
                              {copiedId === b._id ? '✓ Copied' : '📋'}
                            </button>
                          </div>

                          <div className="d-flex align-items-center gap-1">
                            <span
                              className={`badge px-2 py-1 small text-uppercase ${
                                isConfirmed
                                  ? 'bg-success bg-opacity-20 text-success border border-success border-opacity-35'
                                  : b.status === 'cancelled'
                                  ? 'bg-danger bg-opacity-20 text-danger border border-danger border-opacity-35'
                                  : 'bg-warning bg-opacity-20 text-warning border border-warning border-opacity-35'
                              }`}
                              style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}
                            >
                              {b.status === 'confirmed'
                                ? 'Confirmed (Demo)'
                                : b.status === 'cancelled'
                                ? 'Cancelled (Demo)'
                                : 'Pending (Demo)'}
                            </span>
                            <span
                              className={`badge px-2 py-1 small text-uppercase ${
                                isPaid
                                  ? 'bg-info bg-opacity-15 text-info border border-info border-opacity-25'
                                  : b.paymentStatus === 'failed'
                                  ? 'bg-danger bg-opacity-20 text-danger border border-danger border-opacity-25'
                                  : 'bg-warning bg-opacity-20 text-warning border border-warning border-opacity-25'
                              }`}
                              style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}
                            >
                              💳 {b.paymentStatus === 'paid'
                                ? 'Paid (Demo)'
                                : b.paymentStatus === 'failed'
                                ? 'Failed (Demo)'
                                : 'Pending (Demo)'}
                            </span>
                          </div>
                        </div>

                        {/* Card Main Body */}
                        <div className="p-3 p-sm-4">
                          <div className="d-flex gap-3 align-items-start">
                            {/* Poster Thumbnail */}
                            <div
                              className="rounded-3 overflow-hidden flex-shrink-0 shadow-sm"
                              style={{
                                width: '76px',
                                height: '112px',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                background: '#12182c',
                              }}
                            >
                              {posterSrc ? (
                                <img
                                  src={posterSrc}
                                  alt={b.movie?.title || 'Movie Poster'}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = posterFallback;
                                  }}
                                />
                              ) : (
                                <div className="w-100 h-100 d-flex align-items-center justify-content-center text-secondary">
                                  🎬
                                </div>
                              )}
                            </div>

                            {/* Movie Title & Cinema Details */}
                            <div className="flex-grow-1 min-w-0">
                              <h5 className="fw-bold text-white mb-1 brand-font text-truncate" title={b.movie?.title}>
                                {b.movie?.title || 'Unknown Movie'}
                              </h5>

                              <div className="d-flex flex-wrap gap-1 align-items-center mb-2">
                                <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-25" style={{ fontSize: '0.68rem' }}>
                                  {b.format || b.showtime?.format || '2D'}
                                </span>
                                {b.movie?.certification && (
                                  <span className="badge bg-secondary bg-opacity-40 text-light" style={{ fontSize: '0.68rem' }}>
                                    {b.movie.certification}
                                  </span>
                                )}
                              </div>

                              <div className="small text-secondary mb-1">
                                <span className="text-white fw-semibold d-block text-truncate">
                                  🏛️ {b.theatre?.name || 'Cinema Hall'}
                                </span>
                                <span className="text-truncate d-block" style={{ fontSize: '0.74rem' }}>
                                  📍 {b.theatre?.location || b.theatre?.city || 'Anantapur'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Show Date & Time Schedule Row */}
                          <div
                            className="row g-2 p-2 px-3 rounded-3 my-3 text-center"
                            style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}
                          >
                            <div className="col-6 border-end border-white border-opacity-10 text-start">
                              <span className="text-secondary d-block" style={{ fontSize: '0.68rem' }}>
                                📅 SHOW DATE
                              </span>
                              <strong className="text-white small d-block mt-0 text-truncate">
                                {formatDate(b.showDate)}
                              </strong>
                            </div>
                            <div className="col-6 text-start ps-3">
                              <span className="text-secondary d-block" style={{ fontSize: '0.68rem' }}>
                                ⏰ SHOWTIME
                              </span>
                              <strong className="text-danger small d-block mt-0">
                                {b.showTime || b.showtime?.time || 'Scheduled Show'}
                              </strong>
                            </div>
                          </div>

                          {/* Selected Seats Pills */}
                          <div className="mb-3">
                            <span className="text-secondary small d-block mb-1" style={{ fontSize: '0.72rem' }}>
                              SELECTED SEATS ({b.seatCount || b.seats?.length || 0}):
                            </span>
                            <div className="d-flex flex-wrap gap-1">
                              {Array.isArray(b.seats) && b.seats.length > 0 ? (
                                b.seats.map((seat, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="badge px-2 py-1 text-white fw-bold"
                                    style={{
                                      background: 'linear-gradient(135deg, #f84464 0%, #b21032 100%)',
                                      fontSize: '0.76rem',
                                      letterSpacing: '0.04em',
                                    }}
                                  >
                                    {seat}
                                  </span>
                                ))
                              ) : (
                                <span className="text-secondary small">General Admission</span>
                              )}
                            </div>
                          </div>

                          {/* Total Amount & Action CTA */}
                          <div className="d-flex justify-content-between align-items-center pt-3 border-top border-white border-opacity-10">
                            <div>
                              <span className="text-secondary d-block" style={{ fontSize: '0.7rem' }}>
                                TOTAL (DEMO)
                              </span>
                              <span className="h5 fw-bold text-white mb-0" style={{ letterSpacing: '-0.02em' }}>
                                ₹{b.totalAmount || 0}
                              </span>
                            </div>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger px-3 py-1 rounded-pill d-flex align-items-center gap-1"
                              onClick={() => handleViewDetails(b)}
                              aria-label={`View ticket details for booking ${b.bookingRef}`}
                            >
                              <span>🎟️</span>
                              <span>View E-Ticket</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Booking Details / E-Ticket Modal */}
      <BookingDetailsModal
        bookingId={selectedBookingForDetails?._id}
        initialBooking={selectedBookingForDetails}
        isOpen={detailsModalOpen}
        onClose={handleCloseDetails}
        showToast={showToast}
        onBookingCancelled={handleBookingCancelled}
      />
    </div>
  );
}

export default MyBookingsPage;
