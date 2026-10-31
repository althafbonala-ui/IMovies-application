import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { THEATRES_ANANTAPUR } from '../data/mockMovies';
import { fetchShowtimes } from '../services/movieService';
import {
  createBooking,
  processDemoPayment,
  cancelBooking,
} from '../services/bookingService';

// Generate dynamic booking dates starting from current local date (Rolling 18 calendar days)
// Stored as ISO date strings (YYYY-MM-DD); formatted with friendly labels for display
const getBookingDates = (daysCount = 18) => {
  const dates = [];
  const weekdayShort = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const weekdayFull = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 0; i < daysCount; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const isoDate = `${yyyy}-${mm}-${dd}`;

    const dayLabel = i === 0 ? 'TODAY' : i === 1 ? 'TOMORROW' : weekdayShort[d.getDay()];
    const dateNum = String(d.getDate());
    const monthLabel = monthNames[d.getMonth()].toUpperCase();
    const fullDate = `${weekdayFull[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;

    dates.push({
      iso: isoDate,
      day: dayLabel,
      date: dateNum,
      month: monthLabel,
      full: fullDate,
    });
  }
  return dates;
};

const BOOKING_DATES = getBookingDates(18);

// Format any YYYY-MM-DD ISO date string into a user-friendly booking date tab object
const formatBookingDate = (isoDate) => {
  if (!isoDate || typeof isoDate !== 'string') return null;
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;

  const [year, month, day] = parts;
  const d = new Date(year, month - 1, day);

  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

  const weekdayShort = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const weekdayFull = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dayLabel =
    isoDate === todayIso
      ? 'TODAY'
      : isoDate === tomorrowIso
      ? 'TOMORROW'
      : weekdayShort[d.getDay()];

  const dateNum = String(d.getDate());
  const monthLabel = monthNames[d.getMonth()].toUpperCase();
  const fullDate = `${weekdayFull[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;

  return {
    iso: isoDate,
    day: dayLabel,
    date: dateNum,
    month: monthLabel,
    full: fullDate,
  };
};

// Seat layout definitions (standard screen grid: 6 rows, 58 seats total)
const SEAT_ROWS = [
  { row: 'A', tier: 'Recliner', price: 250, seats: [1, 2, 3, 4, 5, 6, 7, 8] },
  { row: 'B', tier: 'Gold', price: 180, seats: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  { row: 'C', tier: 'Gold', price: 180, seats: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  { row: 'D', tier: 'Gold', price: 180, seats: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  { row: 'E', tier: 'Silver', price: 130, seats: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  { row: 'F', tier: 'Silver', price: 130, seats: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
];

function BookingModal({
  movie,
  selectedCity,
  isOpen,
  onClose,
  theatres,
  user,
  onOpenAuthModal,
  showToast,
  onNavigateToBookings = null,
}) {
  const effectiveTheatres = theatres && theatres.length > 0 ? theatres : THEATRES_ANANTAPUR;

  const [step, setStep] = useState(1); // 1: Showtime, 2: Seats, 3: Review
  const [allMovieShowtimes, setAllMovieShowtimes] = useState([]);
  const [availableDates, setAvailableDates] = useState(BOOKING_DATES);
  const [selectedDate, setSelectedDate] = useState(BOOKING_DATES[0]);
  const [selectedTheatre, setSelectedTheatre] = useState(effectiveTheatres[0]);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatWarning, setSeatWarning] = useState('');

  // Loading & error state
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);
  const [showtimesError, setShowtimesError] = useState(null);

  // Ref for horizontally scrolling 30-day date tabs
  const dateTabsRef = useRef(null);

  const scrollDateTabs = (direction) => {
    if (dateTabsRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      dateTabsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Booking submission states & Demo Payment states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingDemoPayment, setIsProcessingDemoPayment] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [selectedDemoMethod, setSelectedDemoMethod] = useState('Demo UPI (Simulated)');
  const [demoPaymentFeedback, setDemoPaymentFeedback] = useState(null);
  const [bookingError, setBookingError] = useState(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [bookingRef, setBookingRef] = useState('');
  const [savedTicketAlert, setSavedTicketAlert] = useState(false);

  // Derive live showtimes for the currently selected date
  const liveShowtimes = useMemo(() => {
    if (!allMovieShowtimes || allMovieShowtimes.length === 0 || !selectedDate?.iso) {
      return [];
    }
    return allMovieShowtimes.filter((st) => st.date === selectedDate.iso);
  }, [allMovieShowtimes, selectedDate?.iso]);

  // Fetch real showtimes from backend whenever modal opens, movie changes, or city changes
  useEffect(() => {
    if (!isOpen || !movie) return;

    let isMounted = true;
    setLoadingShowtimes(true);
    setShowtimesError(null);
    setBookingError(null);

    const loadLiveShowtimes = async () => {
      try {
        const movieId = movie._id || movie.slug || movie.id;
        const res = await fetchShowtimes({
          movieId,
          city: selectedCity?.name,
        });

        if (!isMounted) return;

        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setAllMovieShowtimes(res.data);

          // Extract distinct dates from available showtimes
          const distinctDates = [...new Set(res.data.map((st) => st.date))]
            .filter(Boolean)
            .sort();

          if (distinctDates.length > 0) {
            // Requirement 7: Do not silently present past dates as bookable future shows.
            // When today or future showtimes exist in MongoDB, only display active dates >= today.
            const now = new Date();
            const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            const futureOrTodayDates = distinctDates.filter((d) => d >= todayIso);
            const activeDates = futureOrTodayDates.length > 0 ? futureOrTodayDates : distinctDates;

            const formattedDateTabs = activeDates
              .map(formatBookingDate)
              .filter(Boolean);

            setAvailableDates(formattedDateTabs);

            // Determine initial selected date:
            // 1. Prefer today if today has shows
            // 2. Otherwise prefer earliest upcoming date (> today)
            // 3. Otherwise first active date
            let initialDateTab = formattedDateTabs.find((d) => d.iso === todayIso);
            if (!initialDateTab) {
              initialDateTab = formattedDateTabs.find((d) => d.iso > todayIso);
            }
            if (!initialDateTab) {
              initialDateTab = formattedDateTabs[0];
            }

            setSelectedDate(initialDateTab);

            // Set initial showtime for that date
            const initialShows = res.data.filter((st) => st.date === initialDateTab.iso);
            if (initialShows.length > 0) {
              const currentThId =
                selectedTheatre?._id?.toString() ||
                selectedTheatre?.slug ||
                selectedTheatre?.id;

              const matchingShows = initialShows.filter((st) => {
                const stThId = st.theatre?._id
                  ? st.theatre._id.toString()
                  : st.theatre?.toString();
                const stThSlug = st.theatre?.slug;
                return (
                  (currentThId && stThId === currentThId) ||
                  (currentThId && stThSlug === currentThId)
                );
              });

              const initialShow = matchingShows.length > 0 ? matchingShows[0] : initialShows[0];
              setSelectedShowtime(initialShow);
              if (initialShow.theatre && typeof initialShow.theatre === 'object') {
                setSelectedTheatre(initialShow.theatre);
              }
            } else {
              setSelectedShowtime(null);
            }
          } else {
            const defaultDates = getBookingDates();
            setAvailableDates(defaultDates);
            setSelectedDate(defaultDates[0]);
            setSelectedShowtime(null);
          }
        } else {
          setAllMovieShowtimes([]);
          const defaultDates = getBookingDates();
          setAvailableDates(defaultDates);
          setSelectedDate(defaultDates[0]);
          setSelectedShowtime(null);
        }
      } catch (err) {
        if (isMounted) {
          setShowtimesError('Unable to load showtimes from backend.');
          setAllMovieShowtimes([]);
          const defaultDates = getBookingDates();
          setAvailableDates(defaultDates);
          setSelectedDate(defaultDates[0]);
          setSelectedShowtime(null);
        }
      } finally {
        if (isMounted) {
          setLoadingShowtimes(false);
        }
      }
    };

    loadLiveShowtimes();

    return () => {
      isMounted = false;
    };
  }, [isOpen, movie, selectedCity?.name]);

  // Handler for user clicking on a date tab
  const handleSelectDate = (dateTab) => {
    setSelectedDate(dateTab);
    if (bookingError) setBookingError(null);

    const dateShows = allMovieShowtimes.filter((st) => st.date === dateTab.iso);
    if (dateShows.length > 0) {
      const currentThId =
        selectedTheatre?._id?.toString() ||
        selectedTheatre?.slug ||
        selectedTheatre?.id;

      const matchingShows = dateShows.filter((st) => {
        const stThId = st.theatre?._id
          ? st.theatre._id.toString()
          : st.theatre?.toString();
        const stThSlug = st.theatre?.slug;
        return (
          (currentThId && stThId === currentThId) ||
          (currentThId && stThSlug === currentThId)
        );
      });

      const nextShow = matchingShows.length > 0 ? matchingShows[0] : dateShows[0];
      setSelectedShowtime(nextShow);
      if (nextShow.theatre && typeof nextShow.theatre === 'object') {
        setSelectedTheatre(nextShow.theatre);
      }
    } else {
      setSelectedShowtime(null);
    }
  };

  // Clean up selected seats when switching showtimes (remove seats already booked in new showtime)
  const handleSelectShowtime = (st, th) => {
    setSelectedTheatre(st.theatre && typeof st.theatre === 'object' ? st.theatre : th);
    setSelectedShowtime(st);
    if (bookingError) setBookingError(null);

    // If any currently selected seat is already booked in this slot, filter it out
    const booked = st.bookedSeats || [];
    setSelectedSeats((prev) => prev.filter((s) => !booked.includes(s)));
  };

  // Toggle seat selection
  const handleToggleSeat = (seatId, isSold) => {
    if (isSold || isSubmitting) return;
    if (seatWarning) setSeatWarning('');
    if (bookingError) setBookingError(null);

    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatId));
    } else {
      if (selectedSeats.length >= 8) {
        setSeatWarning('A maximum of 8 seats can be reserved per booking.');
        return;
      }
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  // Calculate pricing breakdown (mirrors backend bookingService.js calculation)
  const calculateTotal = useCallback(() => {
    const baseTicketPrice =
      selectedShowtime && typeof selectedShowtime.price === 'number' && selectedShowtime.price > 0
        ? selectedShowtime.price
        : 180;

    const count = selectedSeats.length;
    const subtotal = baseTicketPrice * count;
    const convFee = count > 0 ? count * 25 : 0; // ₹25 per seat
    const gst = Math.round(convFee * 0.18); // 18% GST on convenience fee
    const grandTotal = subtotal + convFee + gst;

    return { subtotal, convFee, gst, grandTotal, baseTicketPrice };
  }, [selectedShowtime, selectedSeats]);

  const { subtotal, convFee, gst, grandTotal, baseTicketPrice } = calculateTotal();

  // Handle creating pending booking reservation to proceed to demo payment
  const handleProceedToDemoPayment = async () => {
    // Client pre-checks
    if (selectedSeats.length === 0) {
      setSeatWarning('Please select at least 1 seat to proceed.');
      setStep(2);
      return;
    }

    if (!selectedShowtime || !selectedShowtime._id) {
      setBookingError({
        status: 400,
        message: 'No valid showtime selected. Please choose a showtime slot to proceed.',
        conflictingSeats: [],
        isNetworkError: false,
      });
      setStep(1);
      return;
    }

    // Check authentication: verify user or stored token
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('imovies_token') : null;

    if (!user && !token) {
      setBookingError({
        status: 401,
        message:
          'Authentication required to confirm booking. Please sign in or register to complete your reservation.',
        conflictingSeats: [],
        isNetworkError: false,
      });
      if (onOpenAuthModal) {
        onOpenAuthModal();
      }
      return;
    }

    setIsSubmitting(true);
    setBookingError(null);
    setDemoPaymentFeedback(null);

    // Exact backend booking payload: never submit client totals as authoritative values
    const payload = {
      showtimeId: selectedShowtime._id,
      movieId: movie._id || selectedShowtime.movie?._id || selectedShowtime.movie,
      theatreId:
        selectedTheatre?._id ||
        selectedShowtime.theatre?._id ||
        selectedShowtime.theatre,
      date: selectedDate.iso,
      seats: selectedSeats,
      paymentMethod: selectedDemoMethod || 'Demo Payment Pending',
    };

    try {
      const response = await createBooking(payload);

      if (response && response.success && response.data) {
        setPendingBooking(response.data);
        setStep(4); // Advance to Demo Payment Screen
        setBookingError(null);
      } else {
        throw new Error(response?.message || 'Booking reservation initialization failed.');
      }
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      const conflicting = Array.isArray(data?.conflictingSeats)
        ? data.conflictingSeats
        : [];
      const isNetwork = !err.response || err.code === 'ECONNABORTED';

      let message = data?.message || err.message || 'Booking could not be initiated.';

      if (status === 400) {
        message =
          data?.message ||
          'Invalid or incomplete booking details. Please verify your seat selection.';
      } else if (status === 401) {
        message =
          data?.message ||
          'Authentication required or session expired. Please sign in to confirm your booking.';
      } else if (status === 403) {
        message =
          data?.message ||
          'Access denied: You are not authorized to complete this booking.';
      } else if (status === 409) {
        message =
          data?.message ||
          'Selected seat(s) are already reserved. Please choose different seats.';

        // Immediately update bookedSeats so conflicting seats are visually marked sold
        if (conflicting.length > 0) {
          setSelectedShowtime((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              bookedSeats: [
                ...new Set([...(prev.bookedSeats || []), ...conflicting]),
              ],
            };
          });
          // Remove conflicting seats from current selection while keeping non-conflicting seats
          setSelectedSeats((prev) =>
            prev.filter((s) => !conflicting.includes(s))
          );
        }
      } else if (status === 500) {
        message =
          data?.message ||
          'Internal server error while reserving seats. Please try again shortly.';
      } else if (isNetwork) {
        message =
          'Network connection error: Unable to reach the server. Please check your network connection before retrying.';
      }

      setBookingError({
        status,
        message,
        conflictingSeats: conflicting,
        isNetworkError: isNetwork,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle simulated demo payment (success or failure)
  const handleSimulateDemoPayment = async (action) => {
    if (!pendingBooking || !pendingBooking._id) {
      setDemoPaymentFeedback({
        type: 'failure',
        message: 'No active pending reservation found. Please return to seats and try again.',
      });
      return;
    }

    setIsProcessingDemoPayment(true);
    setDemoPaymentFeedback(null);

    try {
      const response = await processDemoPayment(pendingBooking._id, {
        simulateStatus: action, // 'success' | 'failure'
        paymentMethod: selectedDemoMethod,
      });

      if (action === 'success') {
        if (response && response.success && response.data) {
          setConfirmedBooking(response.data);
          setBookingRef(response.data.bookingRef || '');
          setBookingConfirmed(true);
          setPendingBooking(null);

          if (showToast) {
            showToast(
              'success',
              'Demo Payment Completed!',
              `Demo tickets booked! Reference: ${response.data.bookingRef}`,
              '🎟️'
            );
          }
        } else {
          throw new Error(response?.message || 'Demo payment confirmation failed.');
        }
      } else {
        // action === 'failure'
        setPendingBooking(null);
        setDemoPaymentFeedback({
          type: 'failure',
          message:
            response?.message ||
            'Demo payment failure simulated. As required, this booking was cancelled and your reserved seats have been released.',
        });
        if (showToast) {
          showToast(
            'warning',
            'Demo Payment Simulated Failure',
            'Simulated payment failure: Booking cancelled and seats released.',
            '⚠️'
          );
        }
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || 'Error processing demo payment.';
      setDemoPaymentFeedback({
        type: 'failure',
        message: msg,
      });
    } finally {
      setIsProcessingDemoPayment(false);
    }
  };

  // Handle cancelling pending reservation from demo payment screen
  const handleCancelPendingBooking = async () => {
    if (pendingBooking && pendingBooking._id) {
      try {
        await cancelBooking(pendingBooking._id, {
          reason: 'User cancelled from demo payment screen',
        });
        if (showToast) {
          showToast('info', 'Booking Cancelled', 'Demo reservation cancelled and seats released.', 'ℹ️');
        }
      } catch (err) {
        console.warn('Error cancelling pending booking:', err.message);
      }
    }
    setPendingBooking(null);
    setDemoPaymentFeedback(null);
    setStep(2);
  };

  const resetBooking = () => {
    if (isSubmitting || isProcessingDemoPayment) return; // Prevent accidental close while request in-flight
    // If pending booking exists and not yet confirmed, release it cleanly
    if (pendingBooking && pendingBooking._id && !bookingConfirmed) {
      cancelBooking(pendingBooking._id, { reason: 'User closed modal during demo payment' }).catch(() => {});
    }
    setPendingBooking(null);
    setBookingConfirmed(false);
    setConfirmedBooking(null);
    setBookingRef('');
    setSavedTicketAlert(false);
    setSeatWarning('');
    setBookingError(null);
    setDemoPaymentFeedback(null);
    setIsSubmitting(false);
    setIsProcessingDemoPayment(false);
    setStep(1);
    setSelectedSeats([]);
    setSelectedDate(availableDates[0] || BOOKING_DATES[0]);
    onClose();
  };

  if (!isOpen || !movie) return null;

  // Group live showtimes by theatre
  const theatresWithShows = effectiveTheatres.map((th) => {
    const thId = th._id ? th._id.toString() : (th.slug || th.id);
    const shows = liveShowtimes.filter((st) => {
      const stThId = st.theatre?._id ? st.theatre._id.toString() : st.theatre?.toString();
      const stThSlug = st.theatre?.slug;
      return (th._id && stThId === th._id.toString()) || (th.slug && stThSlug === th.slug);
    });
    return { theatre: th, shows };
  });

  return (
    <div
      className="modal-backdrop-custom"
      onClick={resetBooking}
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <div
        className="modal-dialog-custom p-0"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '840px' }}
      >
        {/* Top Header Bar */}
        <div className="p-3 px-4 border-bottom border-secondary border-opacity-25 d-flex justify-content-between align-items-center bg-dark bg-opacity-75">
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: '1.4rem' }} aria-hidden="true">🎟️</span>
            <div>
              <h5 id="booking-modal-title" className="fw-bold mb-0 text-white brand-font">
                {movie.title}
              </h5>
              <div className="d-flex align-items-center gap-2 small text-secondary">
                <span className="badge-cert">{movie.certification}</span>
                <span>•</span>
                <span>{Array.isArray(movie.languages) ? movie.languages.join(', ') : movie.languages}</span>
                <span>•</span>
                <span className="text-danger fw-semibold">{selectedCity?.name || 'Cinema'}</span>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span
              className="d-none d-sm-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill"
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#10b981',
                fontSize: '0.74rem',
                fontWeight: '600',
              }}
            >
              ✓ Live Booking System
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary text-light border-0"
              onClick={resetBooking}
              disabled={isSubmitting}
              style={{ fontSize: '1.25rem', lineHeight: 1 }}
              aria-label="Close booking modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Multi-Step Wizard Indicator (if not yet confirmed) */}
        {!bookingConfirmed && (
          <div className="booking-wizard-steps">
            <button
              type="button"
              className={`booking-step-item ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}
              onClick={() => !isSubmitting && !isProcessingDemoPayment && setStep(1)}
              disabled={isSubmitting || isProcessingDemoPayment || step === 4}
            >
              <span className="booking-step-badge">{step > 1 ? '✓' : '1'}</span>
              <span>1. Showtime</span>
            </button>
            <span className="text-secondary opacity-25">➔</span>
            <button
              type="button"
              className={`booking-step-item ${step === 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}
              onClick={() => !isSubmitting && !isProcessingDemoPayment && selectedShowtime && setStep(2)}
              disabled={isSubmitting || isProcessingDemoPayment || !selectedShowtime || step === 4}
            >
              <span className="booking-step-badge">{step > 2 ? '✓' : '2'}</span>
              <span>2. Seats</span>
            </button>
            <span className="text-secondary opacity-25">➔</span>
            <button
              type="button"
              className={`booking-step-item ${step === 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}
              onClick={() => {
                if (!isSubmitting && !isProcessingDemoPayment && selectedSeats.length > 0 && step !== 4) setStep(3);
              }}
              disabled={isSubmitting || isProcessingDemoPayment || selectedSeats.length === 0 || step === 4}
            >
              <span className="booking-step-badge">{step > 3 ? '✓' : '3'}</span>
              <span>3. Review</span>
            </button>
            <span className="text-secondary opacity-25">➔</span>
            <button
              type="button"
              className={`booking-step-item ${step === 4 ? 'active' : ''}`}
              disabled={step !== 4 || isProcessingDemoPayment}
            >
              <span className="booking-step-badge">4</span>
              <span>4. Demo Pay</span>
            </button>
          </div>
        )}

        {/* Content Section */}
        {bookingConfirmed && confirmedBooking ? (
          /* Real Backend Confirmed Booking E-Ticket View */
          <div className="p-4 p-md-5 text-center">
            <div className="py-2">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                style={{
                  width: '64px',
                  height: '64px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '2px solid #10b981',
                }}
              >
                <span style={{ fontSize: '2rem', color: '#10b981' }}>✓</span>
              </div>
              <h3 className="fw-bold text-white mb-1">Booking Confirmed!</h3>
              <p className="text-secondary small mb-4">
                Your reservation has been confirmed in the iMovies system.
              </p>

              {/* Digital E-Ticket Card */}
              <div
                className="mx-auto text-start p-4 rounded-4 mb-4"
                style={{
                  maxWidth: '540px',
                  background: 'linear-gradient(145deg, #131c31 0%, #0d1424 100%)',
                  border: '1px solid rgba(248, 68, 100, 0.4)',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
                }}
              >
                <div className="d-flex justify-content-between align-items-center pb-3 border-bottom border-secondary border-opacity-25 mb-3">
                  <div>
                    <h5 className="fw-bold text-white mb-0">
                      {confirmedBooking.movie?.title || movie.title}
                    </h5>
                    <small className="text-danger fw-semibold">
                      {confirmedBooking.format || selectedShowtime?.format || '2D'}
                    </small>
                  </div>
                  <div className="text-end">
                    <span className="badge bg-secondary small">BOOKING ID</span>
                    <div className="font-monospace small text-white fw-bold">
                      {confirmedBooking.bookingRef || bookingRef}
                    </div>
                  </div>
                </div>

                <div className="row g-3 small mb-3">
                  <div className="col-6">
                    <div className="text-secondary">Cinema</div>
                    <div className="fw-bold text-white">
                      {confirmedBooking.theatre?.name || selectedTheatre.name}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {confirmedBooking.theatre?.location || selectedTheatre.location}
                    </div>
                  </div>
                  <div className="col-6 text-end">
                    <div className="text-secondary">Date & Showtime</div>
                    <div className="fw-bold text-white">{confirmedBooking.showDate}</div>
                    <div className="text-warning fw-bold">{confirmedBooking.showTime}</div>
                  </div>
                  <div className="col-6">
                    <div className="text-secondary">Seats ({confirmedBooking.seatCount})</div>
                    <div className="fw-bold text-danger fs-6">
                      {confirmedBooking.seats.join(', ')}
                    </div>
                  </div>
                  <div className="col-6 text-end">
                    <div className="text-secondary">Total Paid</div>
                    <div className="fw-bold text-success fs-6">
                      ₹{confirmedBooking.totalAmount}
                    </div>
                  </div>
                </div>

                {/* Server-Calculated Price Breakdown */}
                <div
                  className="p-3 rounded-3 mb-3"
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="d-flex justify-content-between text-secondary small mb-1">
                    <span>Base Ticket Fare</span>
                    <span className="text-white">₹{confirmedBooking.subtotal}</span>
                  </div>
                  <div className="d-flex justify-content-between text-secondary small mb-1">
                    <span>Convenience Fee</span>
                    <span className="text-white">₹{confirmedBooking.convenienceFee}</span>
                  </div>
                  <div className="d-flex justify-content-between text-secondary small pb-1 mb-1 border-bottom border-secondary border-opacity-25">
                    <span>Integrated GST (18%)</span>
                    <span className="text-white">₹{confirmedBooking.gst}</span>
                  </div>
                  <div className="d-flex justify-content-between text-white fw-bold small">
                    <span>Final Amount Paid</span>
                    <span className="text-success">₹{confirmedBooking.totalAmount}</span>
                  </div>
                </div>

                {/* Demo Payment Confirmation Notice Banner */}
                <div
                  className="p-2 px-3 rounded-3 mb-3 text-center small fw-semibold"
                  style={{
                    background: 'rgba(234, 179, 8, 0.1)',
                    border: '1px solid rgba(234, 179, 8, 0.3)',
                    color: '#fde047',
                    fontSize: '0.78rem',
                  }}
                >
                  ⚠️ DEMO CONFIRMATION ONLY — Simulated transaction. No real money was charged.
                </div>

                {/* Email Delivery Status Badge - Strictly displays 'sent' only when delivery succeeds */}
                {confirmedBooking.emailDelivery?.status === 'sent' && (
                  <div
                    className="p-2 px-3 rounded-3 mb-3 text-start small d-flex align-items-center gap-2"
                    style={{
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      color: '#a7f3d0',
                      fontSize: '0.8rem',
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>📧</span>
                    <div>
                      <strong>Confirmation Email & PDF Ticket Sent!</strong>
                      <div style={{ fontSize: '0.74rem', opacity: 0.9 }}>
                        Delivered to {confirmedBooking.emailDelivery.recipientEmail || confirmedBooking.user?.email || 'your registered email'}.
                      </div>
                    </div>
                  </div>
                )}

                {/* Status & Payment Method */}
                <div className="d-flex justify-content-between text-secondary small mb-2">
                  <span>
                    Status:{' '}
                    <strong className="text-success text-capitalize">
                      ✓ {confirmedBooking.status} (Demo)
                    </strong>
                  </span>
                  <span>
                    Payment:{' '}
                    <strong className="text-light">
                      {confirmedBooking.paymentMethod}
                    </strong>
                  </span>
                </div>
                {confirmedBooking.demoTransactionId && (
                  <div className="text-secondary small mb-2 text-start font-monospace" style={{ fontSize: '0.75rem' }}>
                    Demo Txn Ref: <span className="text-info">{confirmedBooking.demoTransactionId}</span>
                  </div>
                )}

                {/* Barcode Notice */}
                <div className="text-center pt-3 border-top border-secondary border-opacity-25">
                  <div
                    className="font-monospace text-secondary mb-1"
                    style={{ letterSpacing: '0.3em', fontSize: '0.85rem' }}
                  >
                    |||||| | ||||| |||| || | |||| |||||
                  </div>
                  <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                    Show this M-Ticket at cinema entrance • Reference: {confirmedBooking.bookingRef}
                  </small>
                </div>
              </div>

              {/* Saved Ticket Alert feedback */}
              {savedTicketAlert && (
                <div className="alert alert-success py-2 px-3 small rounded-3 mb-3 text-center d-flex align-items-center justify-content-center gap-2">
                  <span>✓ Digital ticket [{confirmedBooking.bookingRef}] saved to session!</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="d-flex flex-wrap justify-content-center gap-2">
                <button
                  type="button"
                  className="btn btn-bms-outline"
                  onClick={() => setSavedTicketAlert(true)}
                >
                  📥 Save E-Ticket
                </button>
                {onNavigateToBookings && (
                  <button
                    type="button"
                    className="btn btn-bms-primary d-flex align-items-center gap-1"
                    onClick={() => {
                      resetBooking();
                      onNavigateToBookings();
                    }}
                  >
                    <span>🎟️</span>
                    <span>View in My Bookings</span>
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-outline-light"
                  onClick={resetBooking}
                >
                  Book Another Movie
                </button>
              </div>
            </div>
          </div>
        ) : step === 1 ? (
          /* Step 1: Select Date & Showtime */
          <div className="p-3 p-md-4">
            {/* Step 1.1: Date Selection Tabs (Horizontally Scrollable 18-Day Calendar) */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label
                  className="text-secondary small fw-bold text-uppercase mb-0"
                  style={{ letterSpacing: '0.08em' }}
                >
                  Select Show Date ({availableDates.length} Days Available)
                </label>
                {availableDates.length > 5 && (
                  <div className="d-flex gap-1">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary py-0 px-2 text-light"
                      onClick={() => scrollDateTabs('left')}
                      aria-label="Scroll dates left"
                      style={{ fontSize: '0.85rem', lineHeight: '1.4' }}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary py-0 px-2 text-light"
                      onClick={() => scrollDateTabs('right')}
                      aria-label="Scroll dates right"
                      style={{ fontSize: '0.85rem', lineHeight: '1.4' }}
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>
              <div
                ref={dateTabsRef}
                className="d-flex gap-2 overflow-x-auto pb-1 hide-scrollbar"
                style={{ scrollBehavior: 'smooth' }}
              >
                {availableDates.map((d, idx) => {
                  const isSelected = selectedDate?.iso === d.iso;
                  return (
                    <button
                      key={d.iso || idx}
                      type="button"
                      onClick={() => handleSelectDate(d)}
                      className="border-0 rounded-3 p-2 text-center transition flex-shrink-0"
                      style={{
                        minWidth: '72px',
                        backgroundColor: isSelected ? '#f84464' : 'rgba(255,255,255,0.05)',
                        color: isSelected ? '#ffffff' : '#cbd5e1',
                        border: isSelected ? '1px solid #f84464' : '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                      }}
                      aria-label={`Select date ${d.full}`}
                    >
                      <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>{d.day}</div>
                      <div className="fs-5 fw-bold leading-none">{d.date}</div>
                      <div style={{ fontSize: '0.7rem' }}>{d.month}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 1.2: Select Cinema & Showtime */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label
                  className="text-secondary small fw-bold text-uppercase mb-0"
                  style={{ letterSpacing: '0.08em' }}
                >
                  Select Cinema & Showtime in {selectedCity?.name || 'City'}
                </label>
                {loadingShowtimes && (
                  <span className="text-secondary small d-flex align-items-center gap-1">
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Checking live shows...</span>
                  </span>
                )}
              </div>

              {showtimesError && (
                <div className="alert alert-warning py-2 px-3 small rounded-3 mb-3">
                  ⚠️ {showtimesError} Please verify backend connection.
                </div>
              )}

              {loadingShowtimes ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-danger mb-2" role="status"></div>
                  <div className="text-secondary small">Loading available cinema screens...</div>
                </div>
              ) : liveShowtimes.length === 0 ? (
                <div
                  className="text-center py-4 p-3 rounded-3"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span style={{ fontSize: '1.8rem' }} aria-hidden="true">🎬</span>
                  <h6 className="text-white mt-2 mb-1">No showtimes found for {selectedDate.full}</h6>
                  <p className="text-secondary small mb-0">
                    Please choose another date above or select a different cinema hall.
                  </p>
                </div>
              ) : (
                <div
                  className="d-flex flex-column gap-2"
                  style={{ maxHeight: '280px', overflowY: 'auto' }}
                >
                  {theatresWithShows.map(({ theatre: th, shows }) => {
                    if (shows.length === 0) return null;

                    const thId = th._id ? th._id.toString() : (th.slug || th.id);
                    const currentThId =
                      selectedTheatre?._id?.toString() ||
                      selectedTheatre?.slug ||
                      selectedTheatre?.id;

                    const isCurrent = currentThId === thId;

                    return (
                      <div
                        key={thId}
                        className="p-3 rounded-3 transition"
                        style={{
                          background: isCurrent
                            ? 'rgba(248, 68, 100, 0.08)'
                            : 'rgba(255,255,255,0.02)',
                          border: isCurrent
                            ? '1px solid rgba(248, 68, 100, 0.5)'
                            : '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                          <div>
                            <strong className="text-white me-2">{th.name}</strong>
                            {th.badge && (
                              <span className="badge bg-secondary bg-opacity-25 text-light small me-2">
                                {th.badge}
                              </span>
                            )}
                            <div className="text-secondary small">{th.location}</div>
                          </div>
                        </div>

                        {/* Showtimes for this theatre */}
                        <div className="d-flex flex-wrap gap-2 pt-1">
                          {shows.map((st) => {
                            const isShowSelected = selectedShowtime?._id === st._id;
                            const isSoldOut = st.status === 'sold_out';

                            return (
                              <button
                                key={st._id}
                                type="button"
                                onClick={() => handleSelectShowtime(st, th)}
                                disabled={isSoldOut}
                                className={`showtime-btn ${st.status} ${isShowSelected ? 'active' : ''}`}
                                aria-label={`Select showtime ${st.time} at ${th.name}`}
                              >
                                <div>{st.time}</div>
                                <div style={{ fontSize: '0.68rem', opacity: 0.85 }}>
                                  {st.format} • ₹{st.price}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Navigation for Step 1 */}
            <div className="pt-3 border-top border-secondary border-opacity-25 d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div className="small text-secondary">
                {selectedShowtime ? (
                  <>
                    Selected: <strong className="text-white">{selectedTheatre.name}</strong> @{' '}
                    <strong className="text-warning">{selectedShowtime.time}</strong> ({selectedDate.full})
                  </>
                ) : (
                  <span>Please select a showtime above to proceed</span>
                )}
              </div>
              <button
                type="button"
                className="btn btn-bms-primary px-4 fw-bold"
                onClick={() => setStep(2)}
                disabled={!selectedShowtime}
              >
                Proceed to Select Seats ➔
              </button>
            </div>
          </div>
        ) : step === 2 ? (
          /* Step 2: Interactive Seat Selection with Real Reserved Seats */
          <div className="p-3 p-md-4">
            {seatWarning && (
              <div className="alert alert-warning py-2 px-3 small rounded-3 mb-3 d-flex align-items-center justify-content-between">
                <span>⚠️ {seatWarning}</span>
                <button
                  type="button"
                  className="btn-close btn-close-white btn-sm"
                  onClick={() => setSeatWarning('')}
                  aria-label="Dismiss warning"
                ></button>
              </div>
            )}

            <div
              className="p-3 rounded-3 mb-3"
              style={{ background: '#0a0f1d', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                <div>
                  <span className="text-white fw-bold">{selectedTheatre.name}</span>
                  <span className="text-secondary small ms-2">
                    • {selectedDate.day}, {selectedDate.date} {selectedDate.month} @ {selectedShowtime?.time}
                  </span>
                  <span className="badge bg-secondary ms-2 small">
                    {selectedShowtime?.format} • ₹{baseTicketPrice}/ticket
                  </span>
                </div>
                {/* Legend */}
                <div className="d-flex gap-3 small text-secondary">
                  <div className="d-flex align-items-center gap-1">
                    <span className="seat" style={{ width: '16px', height: '16px', cursor: 'default' }}></span>
                    <span style={{ fontSize: '0.75rem' }}>Available</span>
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <span className="seat selected" style={{ width: '16px', height: '16px', cursor: 'default' }}></span>
                    <span style={{ fontSize: '0.75rem' }}>Selected</span>
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <span className="seat sold" style={{ width: '16px', height: '16px', cursor: 'default' }}></span>
                    <span style={{ fontSize: '0.75rem' }}>Sold Out</span>
                  </div>
                </div>
              </div>

              {/* Screen Display */}
              <div className="cinema-screen-container">
                <div className="cinema-screen"></div>
                <div className="cinema-screen-label">SCREEN THIS WAY (EYES TOWARDS CINEMA DISPLAY)</div>
              </div>

              {/* Seat Matrix */}
              <div className="d-flex flex-column align-items-center overflow-x-auto py-2">
                {SEAT_ROWS.map((row) => (
                  <div key={row.row} className="seat-row">
                    <span className="seat-row-label">{row.row}</span>
                    <div className="d-flex gap-1">
                      {row.seats.map((num) => {
                        const seatId = `${row.row}${num}`;
                        // Live check: is seat present in showtime's real bookedSeats array?
                        const isSold = Boolean(
                          selectedShowtime?.bookedSeats &&
                            selectedShowtime.bookedSeats.includes(seatId)
                        );
                        const isSelected = selectedSeats.includes(seatId);

                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleToggleSeat(seatId, isSold)}
                            className={`seat ${isSold ? 'sold' : ''} ${isSelected ? 'selected' : ''}`}
                            title={`Seat ${seatId} (${row.tier} - ₹${baseTicketPrice}) ${isSold ? '[Sold Out]' : ''}`}
                            aria-label={`Seat ${seatId}, ${row.tier}, Price ₹${baseTicketPrice}, ${
                              isSold ? 'Sold' : isSelected ? 'Selected' : 'Available'
                            }`}
                            disabled={isSold}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                    <span
                      className="text-secondary small ms-2"
                      style={{ fontSize: '0.7rem', width: '70px' }}
                    >
                      ₹{baseTicketPrice}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2 Bottom Action Bar */}
            <div className="pt-3 border-top border-secondary border-opacity-25 d-flex flex-wrap justify-content-between align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary text-light btn-sm px-3"
                onClick={() => setStep(1)}
              >
                ← Back to Showtimes
              </button>
              <div className="d-flex align-items-center gap-3">
                <div className="text-end">
                  <div className="small text-secondary">
                    Seats:{' '}
                    <strong className="text-white">
                      {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None selected'}
                    </strong>{' '}
                    ({selectedSeats.length})
                  </div>
                  <div className="fw-bold text-success">
                    Subtotal: ₹{subtotal}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-bms-primary px-4 fw-bold"
                  onClick={() => setStep(3)}
                  disabled={selectedSeats.length === 0}
                >
                  Proceed to Review ➔
                </button>
              </div>
            </div>
          </div>
        ) : step === 3 ? (
          /* Step 3: Review & Pay with Real Backend Reservation */
          <div className="p-3 p-md-4">
            {/* Error Feedback Alert */}
            {bookingError && (
              <div
                className={`alert ${
                  bookingError.status === 409
                    ? 'alert-warning'
                    : bookingError.isNetworkError
                    ? 'alert-warning'
                    : 'alert-danger'
                } py-2 px-3 small rounded-3 mb-3`}
                role="alert"
              >
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div>
                    <strong className="d-block mb-1">
                      {bookingError.status === 401
                        ? '🔒 Authentication Required'
                        : bookingError.status === 409
                        ? '⚠️ Seat Reservation Conflict'
                        : bookingError.isNetworkError
                        ? '⚠️ Network Communication Notice'
                        : '❌ Reservation Failed'}
                    </strong>
                    <span>{bookingError.message}</span>
                  </div>
                  <button
                    type="button"
                    className="btn-close btn-close-white btn-sm"
                    onClick={() => setBookingError(null)}
                    aria-label="Close error message"
                  ></button>
                </div>

                {/* Contextual Action Button inside Alert */}
                {bookingError.status === 401 && (
                  <div className="mt-2 pt-2 border-top border-white border-opacity-10">
                    <button
                      type="button"
                      className="btn btn-sm btn-light fw-bold"
                      onClick={() => {
                        if (onOpenAuthModal) onOpenAuthModal();
                      }}
                    >
                      Sign In / Register Now ➔
                    </button>
                  </div>
                )}
                {bookingError.status === 409 && (
                  <div className="mt-2 pt-2 border-top border-white border-opacity-10">
                    <button
                      type="button"
                      className="btn btn-sm btn-light fw-bold"
                      onClick={() => setStep(2)}
                    >
                      ← Back to Seat Selection to Choose Other Seats
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Authentication Status Banner */}
            {!user && (
              <div
                className="p-3 rounded-3 mb-3 d-flex flex-wrap justify-content-between align-items-center gap-2"
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#93c5fd',
                }}
              >
                <div className="small">
                  <span>ℹ️ <strong>Account Sign-In:</strong> You are not signed in. Please sign in or register to confirm this booking.</span>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-primary fw-bold"
                  onClick={() => {
                    if (onOpenAuthModal) onOpenAuthModal();
                  }}
                  disabled={isSubmitting}
                >
                  Sign In / Register
                </button>
              </div>
            )}

            {user && (
              <div
                className="p-2 px-3 rounded-3 mb-3 d-flex align-items-center gap-2 small"
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34d399',
                }}
              >
                <span>👤</span>
                <span>
                  Booking as: <strong>{user.name}</strong> ({user.email})
                </span>
              </div>
            )}

            {/* Summary Card */}
            <div
              className="p-4 rounded-4 mb-4"
              style={{
                background: 'linear-gradient(145deg, #131c31 0%, #0d1424 100%)',
                border: '1px solid rgba(248, 68, 100, 0.3)',
              }}
            >
              <h5 className="fw-bold text-white mb-3 pb-2 border-bottom border-secondary border-opacity-25">
                Booking Summary & Breakdown
              </h5>

              <div className="row g-3 mb-4">
                <div className="col-sm-6">
                  <span className="text-secondary small d-block">Movie</span>
                  <strong className="text-white fs-6">{movie.title}</strong>
                  <div className="small text-danger">
                    {selectedShowtime?.format || '2D'} • {movie.certification}
                  </div>
                </div>
                <div className="col-sm-6">
                  <span className="text-secondary small d-block">Cinema Hall</span>
                  <strong className="text-white fs-6">{selectedTheatre.name}</strong>
                  <div className="small text-secondary">{selectedTheatre.location}</div>
                </div>
                <div className="col-sm-6">
                  <span className="text-secondary small d-block">Date & Showtime</span>
                  <strong className="text-white">{selectedDate.full}</strong>
                  <div className="text-warning fw-bold">{selectedShowtime?.time}</div>
                </div>
                <div className="col-sm-6">
                  <span className="text-secondary small d-block">
                    Selected Seats ({selectedSeats.length})
                  </span>
                  <strong className="text-danger fs-6">{selectedSeats.join(', ')}</strong>
                </div>
              </div>

              {/* Price Details */}
              <div
                className="p-3 rounded-3"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="d-flex justify-content-between text-secondary small mb-1">
                  <span>Ticket Base Fare ({selectedSeats.length} seats @ ₹{baseTicketPrice})</span>
                  <span className="text-white">₹{subtotal}</span>
                </div>
                <div className="d-flex justify-content-between text-secondary small mb-1">
                  <span>Convenience Fees (₹25/seat)</span>
                  <span className="text-white">₹{convFee}</span>
                </div>
                <div className="d-flex justify-content-between text-secondary small pb-2 mb-2 border-bottom border-secondary border-opacity-25">
                  <span>Integrated GST (18%)</span>
                  <span className="text-white">₹{gst}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold text-white fs-5">Total Amount Payable</span>
                  <span className="display-6 fw-bold text-success mb-0">₹{grandTotal}</span>
                </div>
              </div>

              {/* Notice */}
              <div className="mt-3 text-center">
                <span className="text-secondary small" style={{ fontSize: '0.78rem' }}>
                  🔒 Official reservation: Seats are locked atomically in the database upon confirmation.
                </span>
              </div>
            </div>

            {/* Bottom Actions for Step 3 */}
            <div className="d-flex justify-content-between align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary text-light px-3"
                onClick={() => setStep(2)}
                disabled={isSubmitting}
              >
                ← Back to Seat Selection
              </button>
              <button
                type="button"
                className="btn btn-bms-primary btn-lg px-4 fw-bold d-inline-flex align-items-center gap-2"
                onClick={handleProceedToDemoPayment}
                disabled={isSubmitting || selectedSeats.length === 0 || !selectedShowtime}
              >
                {isSubmitting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    <span>Locking Seats & Loading Demo Pay...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Demo Payment (₹{grandTotal})</span>
                    <span aria-hidden="true">💳 ➔</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Step 4: Demo Payment Simulation Gateway */
          <div className="p-3 p-md-4">
            {/* Demo Alert Header */}
            <div
              className="p-3 rounded-4 mb-4"
              style={{
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.12) 0%, rgba(248, 68, 100, 0.12) 100%)',
                border: '1px solid rgba(234, 179, 8, 0.35)',
              }}
            >
              <div className="d-flex align-items-center gap-2 mb-1">
                <span style={{ fontSize: '1.4rem' }}>⚠️</span>
                <h5 className="fw-bold text-warning mb-0">DEMO PAYMENT GATEWAY (SIMULATION ONLY)</h5>
              </div>
              <p className="text-light small mb-0 opacity-90" style={{ lineHeight: 1.5 }}>
                <strong>Skill Wallet Movie-Ticket Booking Assessment:</strong> This is a fictional payment simulator.
                <strong> No real payment gateway is connected, and NO real money will be charged.</strong>
                <br />
                <span className="text-warning-emphasis">
                  🔒 Security Notice: Do NOT enter real credit card numbers, CVVs, UPI PINs, or bank passwords.
                </span>
              </p>
            </div>

            {/* Demo Payment Feedback (e.g. if simulated failure was triggered) */}
            {demoPaymentFeedback && (
              <div
                className={`alert ${
                  demoPaymentFeedback.type === 'failure'
                    ? 'alert-danger border-danger'
                    : 'alert-warning border-warning'
                } py-3 px-3 rounded-3 mb-4`}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <strong className="d-block mb-1">
                      {demoPaymentFeedback.type === 'failure'
                        ? '❌ Demo Payment Simulated Failure'
                        : '⚠️ Demo Payment Notice'}
                    </strong>
                    <span className="small">{demoPaymentFeedback.message}</span>
                  </div>
                  <button
                    type="button"
                    className="btn-close btn-close-white btn-sm"
                    onClick={() => setDemoPaymentFeedback(null)}
                    aria-label="Close message"
                  />
                </div>
                {demoPaymentFeedback.type === 'failure' && (
                  <div className="mt-3 pt-2 border-top border-white border-opacity-10 d-flex gap-2 flex-wrap">
                    <button
                      type="button"
                      className="btn btn-sm btn-light fw-bold"
                      onClick={() => {
                        setPendingBooking(null);
                        setDemoPaymentFeedback(null);
                        setStep(2);
                      }}
                    >
                      ← Select Different Seats
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-light"
                      onClick={() => {
                        setPendingBooking(null);
                        setDemoPaymentFeedback(null);
                        setStep(1);
                      }}
                    >
                      Change Showtime
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Order & Amount Recap */}
            <div
              className="p-3 rounded-4 mb-4"
              style={{
                background: 'rgba(19, 28, 49, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 pb-2 mb-2 border-bottom border-white border-opacity-10">
                <div>
                  <span className="text-secondary small d-block">Simulated Order</span>
                  <strong className="text-white fs-6">
                    {movie.title} • {selectedShowtime?.format || '2D'}
                  </strong>
                </div>
                <div className="text-end">
                  <span className="badge bg-secondary small mb-1">DEMO REF</span>
                  <div className="font-monospace small text-info fw-bold">
                    {pendingBooking?.bookingRef || 'PENDING'}
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <div className="small text-secondary">
                  Seats ({selectedSeats.length}): <strong className="text-danger">{selectedSeats.join(', ')}</strong> • {selectedTheatre?.name}
                </div>
                <div className="text-end">
                  <span className="text-secondary small d-block">Demo Amount to Authorize</span>
                  <span className="display-6 fw-bold text-success" style={{ fontSize: '1.75rem' }}>
                    ₹{pendingBooking?.totalAmount || grandTotal}
                  </span>
                </div>
              </div>
            </div>

            {/* Fictional Payment Methods Selector */}
            <div className="mb-4">
              <label
                className="text-secondary small fw-bold text-uppercase mb-2 d-block"
                style={{ letterSpacing: '0.08em' }}
              >
                Select Fictional Demo Payment Method
              </label>

              <div className="row g-3">
                {/* Option 1: Demo UPI */}
                <div className="col-12 col-md-6">
                  <div
                    className={`p-3 rounded-3 h-100 ${
                      selectedDemoMethod === 'Demo UPI (Simulated)' ? 'active-demo-option' : ''
                    }`}
                    onClick={() => !isProcessingDemoPayment && setSelectedDemoMethod('Demo UPI (Simulated)')}
                    style={{
                      background:
                        selectedDemoMethod === 'Demo UPI (Simulated)'
                          ? 'rgba(56, 189, 248, 0.12)'
                          : 'rgba(255, 255, 255, 0.03)',
                      border:
                        selectedDemoMethod === 'Demo UPI (Simulated)'
                          ? '2px solid #38bdf8'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: isProcessingDemoPayment ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <span style={{ fontSize: '1.4rem' }}>📱</span>
                        <strong className="text-white">Demo UPI (Fictional)</strong>
                      </div>
                      <span
                        className={`badge ${
                          selectedDemoMethod === 'Demo UPI (Simulated)'
                            ? 'bg-info text-dark'
                            : 'bg-secondary bg-opacity-35 text-secondary'
                        } small`}
                      >
                        {selectedDemoMethod === 'Demo UPI (Simulated)' ? 'Selected' : 'Select'}
                      </span>
                    </div>
                    <p className="text-secondary small mb-1" style={{ fontSize: '0.78rem' }}>
                      Simulate virtual UPI handle: <code className="text-info">instantpay@demoupi</code>
                    </p>
                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                      Zero PIN required • Instant simulated bank debit
                    </span>
                  </div>
                </div>

                {/* Option 2: Demo Card */}
                <div className="col-12 col-md-6">
                  <div
                    className={`p-3 rounded-3 h-100 ${
                      selectedDemoMethod === 'Demo Card (Simulated)' ? 'active-demo-option' : ''
                    }`}
                    onClick={() => !isProcessingDemoPayment && setSelectedDemoMethod('Demo Card (Simulated)')}
                    style={{
                      background:
                        selectedDemoMethod === 'Demo Card (Simulated)'
                          ? 'rgba(248, 68, 100, 0.12)'
                          : 'rgba(255, 255, 255, 0.03)',
                      border:
                        selectedDemoMethod === 'Demo Card (Simulated)'
                          ? '2px solid #f84464'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: isProcessingDemoPayment ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <span style={{ fontSize: '1.4rem' }}>💳</span>
                        <strong className="text-white">Demo Card (Fictional)</strong>
                      </div>
                      <span
                        className={`badge ${
                          selectedDemoMethod === 'Demo Card (Simulated)'
                            ? 'bg-danger text-white'
                            : 'bg-secondary bg-opacity-35 text-secondary'
                        } small`}
                      >
                        {selectedDemoMethod === 'Demo Card (Simulated)' ? 'Selected' : 'Select'}
                      </span>
                    </div>
                    <p className="text-secondary small mb-1" style={{ fontSize: '0.78rem' }}>
                      Fictional card: <code className="text-danger">Visa •••• 4242 (Demo)</code>
                    </p>
                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                      Zero CVV/OTP required • Pre-approved simulation profile
                    </span>
                  </div>
                </div>

                {/* Option 3: Demo Skill Wallet */}
                <div className="col-12 col-md-6">
                  <div
                    className={`p-3 rounded-3 h-100 ${
                      selectedDemoMethod === 'Demo Skill Wallet (Simulated)' ? 'active-demo-option' : ''
                    }`}
                    onClick={() =>
                      !isProcessingDemoPayment && setSelectedDemoMethod('Demo Skill Wallet (Simulated)')
                    }
                    style={{
                      background:
                        selectedDemoMethod === 'Demo Skill Wallet (Simulated)'
                          ? 'rgba(16, 185, 129, 0.12)'
                          : 'rgba(255, 255, 255, 0.03)',
                      border:
                        selectedDemoMethod === 'Demo Skill Wallet (Simulated)'
                          ? '2px solid #10b981'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: isProcessingDemoPayment ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <span style={{ fontSize: '1.4rem' }}>👛</span>
                        <strong className="text-white">Demo Skill Wallet</strong>
                      </div>
                      <span
                        className={`badge ${
                          selectedDemoMethod === 'Demo Skill Wallet (Simulated)'
                            ? 'bg-success text-white'
                            : 'bg-secondary bg-opacity-35 text-secondary'
                        } small`}
                      >
                        {selectedDemoMethod === 'Demo Skill Wallet (Simulated)' ? 'Selected' : 'Select'}
                      </span>
                    </div>
                    <p className="text-secondary small mb-1" style={{ fontSize: '0.78rem' }}>
                      Available Demo Balance: <span className="text-success fw-bold">₹10,000 (Fictional)</span>
                    </p>
                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                      Instant Skill Wallet mock deduction
                    </span>
                  </div>
                </div>

                {/* Option 4: Demo Net Banking */}
                <div className="col-12 col-md-6">
                  <div
                    className={`p-3 rounded-3 h-100 ${
                      selectedDemoMethod === 'Demo Net Banking (Simulated)' ? 'active-demo-option' : ''
                    }`}
                    onClick={() =>
                      !isProcessingDemoPayment && setSelectedDemoMethod('Demo Net Banking (Simulated)')
                    }
                    style={{
                      background:
                        selectedDemoMethod === 'Demo Net Banking (Simulated)'
                          ? 'rgba(168, 85, 247, 0.12)'
                          : 'rgba(255, 255, 255, 0.03)',
                      border:
                        selectedDemoMethod === 'Demo Net Banking (Simulated)'
                          ? '2px solid #a855f7'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: isProcessingDemoPayment ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <span style={{ fontSize: '1.4rem' }}>🏦</span>
                        <strong className="text-white">Demo Net Banking</strong>
                      </div>
                      <span
                        className={`badge ${
                          selectedDemoMethod === 'Demo Net Banking (Simulated)'
                            ? 'bg-purple text-white'
                            : 'bg-secondary bg-opacity-35 text-secondary'
                        } small`}
                      >
                        {selectedDemoMethod === 'Demo Net Banking (Simulated)' ? 'Selected' : 'Select'}
                      </span>
                    </div>
                    <p className="text-secondary small mb-1" style={{ fontSize: '0.78rem' }}>
                      Sandbox Bank: <span className="text-white">Demo Cinema Pay Direct</span>
                    </p>
                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                      Simulate standard internet banking flow
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulation Action Controls & Protection Against Duplicate Submissions */}
            <div
              className="p-3 rounded-4 mb-3"
              style={{
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
                <div className="small text-secondary text-center text-sm-start">
                  <span className="d-block text-white fw-semibold">Interactive Simulation Test Controls</span>
                  Choose whether to simulate a successful payment or a failed transaction.
                </div>

                <div className="d-flex flex-wrap gap-2 w-100 w-sm-auto justify-content-end">
                  {/* Simulate Failure Button */}
                  <button
                    type="button"
                    className="btn btn-outline-danger px-3 fw-bold d-inline-flex align-items-center gap-2"
                    onClick={() => handleSimulateDemoPayment('failure')}
                    disabled={isProcessingDemoPayment || !pendingBooking}
                  >
                    {isProcessingDemoPayment ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    ) : (
                      <span>✕</span>
                    )}
                    <span>Simulate Failure (Demo)</span>
                  </button>

                  {/* Simulate Success Button */}
                  <button
                    type="button"
                    className="btn btn-success px-4 fw-bold d-inline-flex align-items-center gap-2 shadow-sm"
                    onClick={() => handleSimulateDemoPayment('success')}
                    disabled={isProcessingDemoPayment || !pendingBooking}
                    style={{ background: '#10b981', borderColor: '#10b981' }}
                  >
                    {isProcessingDemoPayment ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                        <span>Authorizing Demo...</span>
                      </>
                    ) : (
                      <>
                        <span>✓</span>
                        <span>Simulate Success (Demo ₹{pendingBooking?.totalAmount || grandTotal})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Cancel & Navigation */}
            <div className="d-flex justify-content-between align-items-center pt-2">
              <button
                type="button"
                className="btn btn-outline-secondary text-light px-3"
                onClick={handleCancelPendingBooking}
                disabled={isProcessingDemoPayment}
              >
                ← Cancel Demo & Release Seats
              </button>
              <small className="text-secondary font-monospace" style={{ fontSize: '0.72rem' }}>
                🔒 Demo Safe Sandbox • No Financial Data Retained
              </small>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingModal;
