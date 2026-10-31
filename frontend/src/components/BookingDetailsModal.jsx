import React, { useEffect, useState } from 'react';
import { getBookingById, cancelBooking } from '../services/bookingService';
import { getBannerPlaceholder } from '../data/mockMovies';

/**
 * BookingDetailsModal Component
 *
 * Displays complete E-Ticket and reservation details for a specific booking.
 * Supports cancelling eligible bookings and releasing reserved seats.
 * Reuses the existing GET /api/bookings/:id and POST /api/bookings/:id/cancel endpoints.
 *
 * Props:
 * - bookingId {string}: The ObjectId of the booking to fetch
 * - initialBooking {object|null}: Optional pre-fetched booking data for instant display
 * - isOpen {boolean}: Controls modal visibility
 * - onClose {function}: Callback when modal is closed
 * - showToast {function}: Optional toast notification callback
 * - onBookingCancelled {function}: Callback to notify parent (MyBookingsPage) when booking is cancelled
 */
function BookingDetailsModal({
  bookingId,
  initialBooking = null,
  isOpen,
  onClose,
  showToast = () => {},
  onBookingCancelled,
}) {
  const [booking, setBooking] = useState(initialBooking);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Cancellation states
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of plans');
  const [cancelError, setCancelError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setBooking(null);
      setError(null);
      setLoading(false);
      setCopiedRef(false);
      setConfirmCancelOpen(false);
      setIsCancelling(false);
      setCancelError(null);
      setCancelReason('Change of plans');
      return;
    }

    if (initialBooking && (!bookingId || initialBooking._id === bookingId)) {
      setBooking(initialBooking);
      return;
    }

    if (bookingId) {
      let isMounted = true;
      setLoading(true);
      setError(null);

      getBookingById(bookingId)
        .then((res) => {
          if (isMounted) {
            if (res && res.success && res.data) {
              setBooking(res.data);
            } else {
              setError(res?.message || 'Unable to retrieve booking details.');
            }
          }
        })
        .catch((err) => {
          if (isMounted) {
            const status = err.response?.status;
            let msg = err.response?.data?.message || 'Failed to fetch booking details.';
            if (status === 403) {
              msg = 'Access denied: You are not authorized to view this booking.';
            } else if (status === 404) {
              msg = 'Booking not found.';
            }
            setError(msg);
          }
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [bookingId, initialBooking, isOpen]);

  if (!isOpen) return null;

  const handleCopyRef = (ref) => {
    if (!ref) return;
    try {
      navigator.clipboard.writeText(ref);
      setCopiedRef(true);
      if (showToast) {
        showToast('info', 'Reference Copied', `Booking reference ${ref} copied to clipboard!`, '📋');
      }
      setTimeout(() => setCopiedRef(false), 2500);
    } catch {
      // Fallback
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  // Handle booking cancellation
  const handleConfirmCancel = async () => {
    if (!booking?._id || isCancelling) return;

    // Guard: Prevent cancellation of already-cancelled bookings
    if (booking.status === 'cancelled') {
      setCancelError('This booking has already been cancelled.');
      return;
    }

    setIsCancelling(true);
    setCancelError(null);

    try {
      const payload = {
        reason: cancelReason ? cancelReason.trim() : 'User requested cancellation',
      };
      const response = await cancelBooking(booking._id, payload);

      if (response && response.success) {
        // Update local booking state with populated response data
        if (response.data && response.data.movie) {
          setBooking(response.data);
        } else {
          try {
            const fresh = await getBookingById(booking._id);
            if (fresh && fresh.data) {
              setBooking(fresh.data);
            }
          } catch {
            if (response.data) setBooking(response.data);
          }
        }

        setConfirmCancelOpen(false);

        if (showToast) {
          showToast(
            'success',
            'Booking Cancelled',
            `Booking ${booking.bookingRef} has been cancelled and reserved seats released.`,
            '✅'
          );
        }

        // Notify parent page to refresh booking list and statistics
        if (typeof onBookingCancelled === 'function') {
          onBookingCancelled(response.data || booking);
        }
      } else {
        const errorMsg = response?.message || 'Failed to cancel booking.';
        setCancelError(errorMsg);
        if (showToast) {
          showToast('error', 'Cancellation Failed', errorMsg, '⚠️');
        }
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Unable to cancel this booking. Please try again.';
      setCancelError(errorMsg);
      if (showToast) {
        showToast('error', 'Cancellation Failed', errorMsg, '⚠️');
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

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

  const posterFallback = booking?.movie ? getBannerPlaceholder(booking.movie) : '';
  const posterSrc =
    booking?.movie?.posterUrl ||
    booking?.movie?.poster ||
    posterFallback;

  return (
    <div
      className="modal-backdrop-custom printable-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-modal-title"
    >
      <div
        className="modal-dialog-custom p-0 printable-ticket-dialog position-relative"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', overflow: 'hidden' }}
      >
        {/* Modal Header */}
        <div
          className="d-flex justify-content-between align-items-center p-3 px-4 border-bottom border-white border-opacity-10"
          style={{ background: 'var(--bg-surface)' }}
        >
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: '1.25rem' }}>🎟️</span>
            <div>
              <h5 className="h6 fw-bold text-white mb-0 brand-font" id="ticket-modal-title">
                Cinema E-Ticket & Receipt
              </h5>
              <span className="text-secondary small" style={{ fontSize: '0.74rem' }}>
                Verified iMovies Digital Pass
              </span>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2 no-print">
            {booking && (
              <button
                type="button"
                className="btn btn-sm btn-outline-light d-flex align-items-center gap-1 py-1 px-2"
                style={{ fontSize: '0.78rem' }}
                onClick={handlePrint}
                title="Print or Save PDF"
              >
                <span>🖨️</span>
                <span className="d-none d-sm-inline">Print</span>
              </button>
            )}
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary text-light border-0"
              onClick={onClose}
              aria-label="Close"
              style={{ fontSize: '1.2rem', lineHeight: 1 }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-3 p-sm-4" style={{ background: '#0b1020', maxHeight: '82vh', overflowY: 'auto' }}>
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-danger mb-3" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
                <span className="visually-hidden">Loading ticket...</span>
              </div>
              <p className="text-secondary small mb-0">Fetching your booking details...</p>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 text-center rounded-3 my-3" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <span style={{ fontSize: '2rem' }}>⚠️</span>
              <h6 className="text-white mt-2 mb-1 fw-bold">Unable to Load Ticket</h6>
              <p className="text-danger small mb-3">{error}</p>
              <button type="button" className="btn btn-sm btn-outline-light" onClick={onClose}>
                Close
              </button>
            </div>
          )}

          {booking && !loading && (
            <div className="printable-ticket-content">
              {/* Top Perforated Ticket Card */}
              <div
                className="rounded-4 p-3 p-sm-4 mb-3 position-relative"
                style={{
                  background: 'linear-gradient(145deg, #10162a 0%, #0e1424 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
                }}
              >
                {/* Header Strip: Reference & Status Badges */}
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 pb-3 mb-3 border-bottom border-white border-opacity-10">
                  <div>
                    <span className="text-secondary small d-block text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.06em' }}>
                      Booking Reference
                    </span>
                    <div className="d-flex align-items-center gap-2">
                      <strong className="text-white fw-bold" style={{ fontSize: '1.05rem', letterSpacing: '0.04em' }}>
                        {booking.bookingRef}
                      </strong>
                      <button
                        type="button"
                        className="btn btn-sm p-0 px-2 py-0 border-0 rounded text-secondary no-print"
                        style={{ background: 'rgba(255,255,255,0.08)', fontSize: '0.72rem' }}
                        onClick={() => handleCopyRef(booking.bookingRef)}
                        title="Copy Reference"
                      >
                        {copiedRef ? '✓ Copied' : '📋 Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <span
                      className={`badge px-2 py-1 small text-uppercase ${
                        booking.status === 'confirmed'
                          ? 'bg-success bg-opacity-25 text-success border border-success border-opacity-50'
                          : booking.status === 'cancelled'
                          ? 'bg-danger bg-opacity-25 text-danger border border-danger border-opacity-50'
                          : 'bg-warning bg-opacity-25 text-warning border border-warning border-opacity-50'
                      }`}
                      style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}
                    >
                      ● {booking.status === 'confirmed'
                        ? 'Confirmed (Demo)'
                        : booking.status === 'cancelled'
                        ? 'Cancelled (Demo)'
                        : 'Pending (Demo)'}
                    </span>
                    <span
                      className={`badge px-2 py-1 small text-uppercase ${
                        booking.paymentStatus === 'paid'
                          ? 'bg-success bg-opacity-20 text-success border border-success border-opacity-25'
                          : booking.paymentStatus === 'refunded'
                          ? 'bg-info bg-opacity-20 text-info border border-info border-opacity-25'
                          : booking.paymentStatus === 'failed'
                          ? 'bg-danger bg-opacity-20 text-danger border border-danger border-opacity-25'
                          : 'bg-warning bg-opacity-20 text-warning border border-warning border-opacity-25'
                      }`}
                      style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}
                    >
                      💳 {booking.paymentStatus === 'paid'
                        ? 'Paid (Demo)'
                        : booking.paymentStatus === 'refunded'
                        ? 'Refunded (Demo)'
                        : booking.paymentStatus === 'failed'
                        ? 'Failed (Demo)'
                        : 'Pending (Demo)'}
                    </span>
                    {booking.emailDelivery?.status === 'sent' && (
                      <span
                        className="badge rounded-pill bg-success bg-opacity-20 text-success border border-success border-opacity-25"
                        style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}
                        title={`Confirmation email sent to ${booking.emailDelivery.recipientEmail || 'customer'}`}
                      >
                        📧 E-Ticket Emailed
                      </span>
                    )}
                  </div>
                </div>

                {/* Cancellation Status Banner */}
                {booking.status === 'cancelled' && (
                  <div
                    className="p-3 rounded-3 mb-3 d-flex align-items-center gap-3 small"
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      color: '#fca5a5',
                    }}
                  >
                    <span style={{ fontSize: '1.4rem' }}>🚫</span>
                    <div>
                      <strong className="d-block text-white">This Booking is Cancelled</strong>
                      <span>
                        Reserved seats ({booking.seats?.join(', ') || 'N/A'}) were released back to showtime inventory.
                        {booking.failureReason && ` • ${booking.failureReason}`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Movie & Cinema Info Section */}
                <div className="d-flex gap-3 align-items-start mb-4">
                  {/* Poster thumbnail */}
                  <div
                    className="rounded-3 overflow-hidden flex-shrink-0"
                    style={{
                      width: '74px',
                      height: '108px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: '#161d33',
                    }}
                  >
                    {posterSrc ? (
                      <img
                        src={posterSrc}
                        alt={booking.movie?.title || 'Movie Poster'}
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

                  {/* Title and Metadata */}
                  <div className="flex-grow-1">
                    <h5 className="fw-bold text-white mb-1 brand-font" style={{ fontSize: '1.2rem' }}>
                      {booking.movie?.title || 'Unknown Title'}
                    </h5>

                    <div className="d-flex flex-wrap gap-1 align-items-center mb-2">
                      {booking.movie?.certification && (
                        <span className="badge bg-secondary bg-opacity-50 text-white" style={{ fontSize: '0.68rem' }}>
                          {booking.movie.certification}
                        </span>
                      )}
                      <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-25" style={{ fontSize: '0.68rem' }}>
                        {booking.format || booking.showtime?.format || '2D'}
                      </span>
                      {booking.movie?.duration && (
                        <span className="text-secondary small" style={{ fontSize: '0.75rem' }}>
                          ⏱️ {booking.movie.duration}
                        </span>
                      )}
                    </div>

                    <div className="small text-secondary">
                      <div className="text-white fw-semibold">
                        🏛️ {booking.theatre?.name || 'Cinema Hall'}
                      </div>
                      <div style={{ fontSize: '0.75rem' }}>
                        📍 {booking.theatre?.location || booking.theatre?.city || 'Anantapur'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Showtime & Schedule Grid */}
                <div
                  className="row g-2 p-3 rounded-3 mb-3 text-center"
                  style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
                >
                  <div className="col-4 border-end border-secondary border-opacity-25">
                    <span className="text-secondary d-block" style={{ fontSize: '0.7rem' }}>DATE</span>
                    <strong className="text-white small d-block mt-1">
                      {formatDate(booking.showDate)}
                    </strong>
                  </div>
                  <div className="col-4 border-end border-secondary border-opacity-25">
                    <span className="text-secondary d-block" style={{ fontSize: '0.7rem' }}>TIME</span>
                    <strong className="text-danger small d-block mt-1">
                      {booking.showTime || booking.showtime?.time || 'Scheduled Show'}
                    </strong>
                  </div>
                  <div className="col-4">
                    <span className="text-secondary d-block" style={{ fontSize: '0.7rem' }}>SCREEN</span>
                    <strong className="text-white small d-block mt-1">
                      {booking.format || 'Screen 1 (4K)'}
                    </strong>
                  </div>
                </div>

                {/* Seat Reservation Section */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-secondary small fw-bold text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}>
                      Reserved Seats ({booking.seatCount || booking.seats?.length || 0})
                    </span>
                    {booking.status === 'cancelled' ? (
                      <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-25" style={{ fontSize: '0.7rem' }}>
                        Seats Released
                      </span>
                    ) : (
                      <span className="badge bg-secondary bg-opacity-25 text-white" style={{ fontSize: '0.7rem' }}>
                        Prime Tier
                      </span>
                    )}
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {Array.isArray(booking.seats) && booking.seats.length > 0 ? (
                      booking.seats.map((seat, sIdx) => (
                        <span
                          key={sIdx}
                          className={`px-3 py-1 rounded-pill fw-bold d-inline-flex align-items-center gap-1 ${
                            booking.status === 'cancelled'
                              ? 'bg-secondary bg-opacity-25 text-secondary border border-secondary border-opacity-25 text-decoration-line-through'
                              : 'text-white'
                          }`}
                          style={{
                            background:
                              booking.status === 'cancelled'
                                ? 'rgba(255, 255, 255, 0.05)'
                                : 'linear-gradient(135deg, #f84464 0%, #b21032 100%)',
                            boxShadow:
                              booking.status === 'cancelled'
                                ? 'none'
                                : '0 2px 8px rgba(248, 68, 100, 0.35)',
                            fontSize: '0.85rem',
                            letterSpacing: '0.04em',
                          }}
                        >
                          💺 {seat}
                        </span>
                      ))
                    ) : (
                      <span className="text-secondary small">General Admission</span>
                    )}
                  </div>
                </div>

                {/* Simulated Cinema Entry Barcode / Void State */}
                {booking.status === 'cancelled' ? (
                  <div
                    className="p-3 rounded-3 mt-3 text-center"
                    style={{
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px dashed rgba(239, 68, 68, 0.4)',
                      color: '#ef4444',
                      borderRadius: '12px',
                    }}
                  >
                    <div className="fw-bold small" style={{ letterSpacing: '0.15em' }}>
                      VOID • BOOKING CANCELLED • NOT VALID FOR ENTRY
                    </div>
                    <div className="text-secondary small mt-1" style={{ fontSize: '0.72rem' }}>
                      Seats have been released back to general cinema availability.
                    </div>
                  </div>
                ) : (
                  <div
                    className="p-3 rounded-3 mt-3 text-center"
                    style={{
                      background: '#ffffff',
                      color: '#0a0f1d',
                      borderRadius: '12px',
                    }}
                  >
                    <div
                      className="font-monospace fw-bold"
                      style={{
                        letterSpacing: '0.3em',
                        fontSize: '0.95rem',
                        fontFamily: 'monospace',
                      }}
                    >
                      ||| | |||| | || ||||| | ||| |||| |
                    </div>
                    <div className="small fw-semibold mt-1" style={{ fontSize: '0.72rem', color: '#475569' }}>
                      ENTRY PASS: {booking.bookingRef} • SCAN AT AUDITORIUM TURNSTILE
                    </div>
                  </div>
                )}
              </div>

              {/* Financial Breakdown Receipt */}
              <div
                className="rounded-3 p-3"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <h6 className="text-white small fw-bold text-uppercase mb-3" style={{ letterSpacing: '0.06em' }}>
                  Payment Breakdown
                </h6>

                {/* Demo Payment Notice */}
                <div
                  className="p-2 px-3 rounded-2 mb-3 text-center small fw-semibold"
                  style={{
                    background: 'rgba(234, 179, 8, 0.1)',
                    border: '1px solid rgba(234, 179, 8, 0.25)',
                    color: '#fde047',
                    fontSize: '0.74rem',
                  }}
                >
                  ⚠️ DEMO TRANSACTION: Fictional simulation only. No real bank funds were charged.
                </div>

                <div className="d-flex justify-content-between text-secondary small py-1">
                  <span>Tickets Subtotal ({booking.seatCount || booking.seats?.length} seats)</span>
                  <span className="text-white fw-medium">₹{booking.subtotal || booking.totalAmount || 0}</span>
                </div>

                {booking.convenienceFee !== undefined && booking.convenienceFee > 0 && (
                  <div className="d-flex justify-content-between text-secondary small py-1">
                    <span>Convenience Fee</span>
                    <span className="text-white fw-medium">₹{booking.convenienceFee}</span>
                  </div>
                )}

                {booking.gst !== undefined && booking.gst > 0 && (
                  <div className="d-flex justify-content-between text-secondary small py-1">
                    <span>Integrated GST (18%)</span>
                    <span className="text-white fw-medium">₹{booking.gst}</span>
                  </div>
                )}

                <div className="d-flex justify-content-between align-items-center pt-2 mt-2 border-top border-white border-opacity-10">
                  <div>
                    <span className="text-white fw-bold d-block">Total Demo Amount</span>
                    <span className="text-secondary" style={{ fontSize: '0.7rem' }}>
                      Via {booking.paymentMethod || 'Simulated Online Payment'} (DEMO ONLY)
                    </span>
                    {booking.demoTransactionId && (
                      <span className="text-info font-monospace d-block" style={{ fontSize: '0.68rem' }}>
                        Ref: {booking.demoTransactionId}
                      </span>
                    )}
                  </div>
                  <span
                    className="h5 fw-bold mb-0"
                    style={{ color: '#f84464', letterSpacing: '-0.02em' }}
                  >
                    ₹{booking.totalAmount || 0}
                  </span>
                </div>
              </div>

              {/* Booked on Timestamp & Account Info */}
              <div className="d-flex justify-content-between align-items-center mt-3 px-1 text-secondary" style={{ fontSize: '0.72rem' }}>
                <span>
                  Booked on: {booking.createdAt ? new Date(booking.createdAt).toLocaleString('en-IN') : 'Recent'}
                </span>
                {booking.user?.name && (
                  <span>
                    Holder: <strong className="text-white">{booking.user.name}</strong>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Cancellation Confirmation Dialog Overlay */}
        {confirmCancelOpen && booking && (
          <div
            className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
            style={{
              background: 'rgba(6, 9, 18, 0.94)',
              backdropFilter: 'blur(6px)',
              zIndex: 1050,
            }}
            role="dialog"
            aria-labelledby="confirm-cancel-heading"
            aria-modal="true"
          >
            <div
              className="p-4 rounded-4 w-100 text-start"
              style={{
                maxWidth: '500px',
                background: '#0e1526',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
              }}
            >
              <div className="d-flex align-items-center gap-3 mb-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: '48px',
                    height: '48px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#ef4444',
                    fontSize: '1.4rem',
                  }}
                >
                  ⚠️
                </div>
                <div>
                  <h5 className="h6 fw-bold text-white mb-0" id="confirm-cancel-heading">
                    Cancel Cinema Booking?
                  </h5>
                  <span className="text-secondary small" style={{ fontSize: '0.78rem' }}>
                    Reference: <strong className="text-white">{booking.bookingRef}</strong>
                  </span>
                </div>
              </div>

              <p className="text-secondary small mb-3" style={{ lineHeight: '1.5' }}>
                Are you sure you want to cancel your booking for{' '}
                <strong className="text-white">{booking.movie?.title}</strong>? Your seats will be
                released immediately and made available for other moviegoers.
              </p>

              {/* Cancellation Details Summary Card */}
              <div
                className="p-3 rounded-3 mb-3 small"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div className="d-flex justify-content-between py-1 text-secondary">
                  <span>Showtime:</span>
                  <span className="text-white fw-semibold">
                    {formatDate(booking.showDate)} • {booking.showTime || booking.showtime?.time}
                  </span>
                </div>
                <div className="d-flex justify-content-between py-1 text-secondary">
                  <span>Cinema Hall:</span>
                  <span className="text-white fw-semibold">{booking.theatre?.name}</span>
                </div>
                <div className="d-flex justify-content-between py-1 text-secondary">
                  <span>Seats to Release:</span>
                  <span className="text-danger fw-bold">{booking.seats?.join(', ')}</span>
                </div>
                <div className="d-flex justify-content-between py-1 border-top border-white border-opacity-10 mt-1 pt-1 text-secondary">
                  <span>Demo Refund:</span>
                  <span className="text-success fw-bold">
                    {booking.paymentStatus === 'paid'
                      ? `₹${booking.totalAmount || 0} (Simulated Refund)`
                      : '₹0 (Demo payment was pending)'}
                  </span>
                </div>
              </div>

              {/* Cancellation Reason Dropdown */}
              <div className="mb-3">
                <label
                  htmlFor="cancel-reason-select"
                  className="form-label text-secondary small mb-1"
                  style={{ fontSize: '0.76rem' }}
                >
                  Reason for cancellation (optional):
                </label>
                <select
                  id="cancel-reason-select"
                  className="form-select form-select-sm text-light border-secondary border-opacity-50"
                  style={{ background: '#131b31', fontSize: '0.82rem' }}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  disabled={isCancelling}
                >
                  <option value="Change of plans">Change of plans / Schedule conflict</option>
                  <option value="Booked wrong date or time">Booked wrong date or showtime</option>
                  <option value="Booked wrong cinema">Booked wrong cinema theatre</option>
                  <option value="Personal emergency">Personal emergency</option>
                  <option value="Testing cancellation">Testing cancellation feature</option>
                  <option value="Other reason">Other reason</option>
                </select>
              </div>

              {/* Inline Error Message */}
              {cancelError && (
                <div
                  className="p-2 px-3 rounded-2 mb-3 small text-danger"
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                  }}
                >
                  ⚠️ {cancelError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="d-flex justify-content-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-light px-3 rounded-pill"
                  onClick={() => {
                    if (!isCancelling) {
                      setConfirmCancelOpen(false);
                      setCancelError(null);
                    }
                  }}
                  disabled={isCancelling}
                >
                  Keep Booking
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-danger px-4 rounded-pill d-flex align-items-center gap-2"
                  onClick={handleConfirmCancel}
                  disabled={isCancelling}
                  id="confirm-cancellation-btn"
                >
                  {isCancelling ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>Confirm Cancellation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div
          className="p-3 px-4 d-flex flex-wrap justify-content-between align-items-center gap-2 border-top border-white border-opacity-10 no-print"
          style={{ background: 'var(--bg-surface)' }}
        >
          <div className="d-flex align-items-center gap-2">
            {booking && booking.status !== 'cancelled' ? (
              <button
                type="button"
                className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1 px-3 py-1 rounded-pill"
                onClick={() => {
                  setCancelError(null);
                  setConfirmCancelOpen(true);
                }}
                disabled={isCancelling}
                id="cancel-booking-btn"
                title="Cancel this booking and release seats"
              >
                <span>🚫</span>
                <span>Cancel Booking</span>
              </button>
            ) : booking && booking.status === 'cancelled' ? (
              <span className="badge bg-danger bg-opacity-20 text-danger border border-danger border-opacity-35 px-3 py-2 rounded-pill small">
                ✕ Booking Cancelled • Seats Released
              </span>
            ) : null}
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-light px-4 py-1 rounded-pill"
              onClick={onClose}
              disabled={isCancelling}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingDetailsModal;
