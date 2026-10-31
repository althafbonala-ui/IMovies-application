import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getBannerPlaceholder } from '../data/mockMovies';
import {
  fetchMovieReviews,
  createMovieReview,
  updateMovieReview,
  deleteMovieReview,
} from '../services/reviewService';

function MovieDetailsModal({
  movie,
  isOpen,
  onClose,
  onBookMovie,
  isInWatchlist = false,
  onToggleWatchlist,
  watchlistLoading = false,
  user = null,
  onOpenAuthModal,
  showToast,
}) {
  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editReviewId, setEditReviewId] = useState(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formValidation, setFormValidation] = useState(null);

  // Deletion state
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Scroll tracking state & refs
  const [isScrolled, setIsScrolled] = useState(false);
  const modalScrollRef = useRef(null);
  const formRef = useRef(null);

  // Rating label helper
  const getRatingLabel = (stars) => {
    switch (stars) {
      case 1:
        return '1 / 5 - Poor';
      case 2:
        return '2 / 5 - Fair';
      case 3:
        return '3 / 5 - Good';
      case 4:
        return '4 / 5 - Very Good';
      case 5:
        return '5 / 5 - Masterpiece!';
      default:
        return 'Tap a star to rate';
    }
  };

  // Movie identifier helper
  const movieId = useMemo(() => {
    if (!movie) return null;
    return movie.slug || movie._id || movie.id;
  }, [movie]);

  // Load reviews function
  const loadReviews = useCallback(async () => {
    if (!movieId) return;
    setLoadingReviews(true);
    setReviewError(null);
    try {
      const res = await fetchMovieReviews(movieId);
      if (res && res.success) {
        setReviews(Array.isArray(res.data) ? res.data : []);
        setStats({
          averageRating: typeof res.averageRating === 'number' ? res.averageRating : 0,
          totalReviews: typeof res.totalReviews === 'number' ? res.totalReviews : 0,
          ratingBreakdown: res.ratingBreakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        });
      }
    } catch (err) {
      // If movie has no backend reviews or backend offline, fall back safely
      setReviewError(err.response?.data?.message || 'Unable to load reviews at this time.');
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, [movieId]);

  // Fetch reviews on modal open or movie change
  useEffect(() => {
    if (isOpen && movie) {
      loadReviews();
      setIsFormOpen(false);
      setEditReviewId(null);
      setDeleteConfirmId(null);
      setFormValidation(null);
      setSelectedRating(0);
      setReviewText('');
    }
  }, [isOpen, movie, loadReviews]);

  // Prevent background-page scrolling while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset scroll to top when movie changes or modal opens
  useEffect(() => {
    if (isOpen && modalScrollRef.current) {
      modalScrollRef.current.scrollTop = 0;
      setIsScrolled(false);
    }
  }, [isOpen, movieId]);

  // Smooth scroll to review form when opened
  useEffect(() => {
    if (isFormOpen && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isFormOpen]);

  // Single scroll listener on the modal dialog
  const handleScroll = useCallback(
    (e) => {
      const scrollTop = e.currentTarget.scrollTop;
      if (scrollTop > 180 && !isScrolled) {
        setIsScrolled(true);
      } else if (scrollTop <= 180 && isScrolled) {
        setIsScrolled(false);
      }
    },
    [isScrolled]
  );

  if (!isOpen || !movie) return null;

  const bannerFallback = getBannerPlaceholder(movie);
  const posterSrc = movie.poster || movie.posterUrl || movie.image || bannerFallback;
  const isUpcoming = movie.status === 'upcoming';

  // Identify current user's review if present
  const currentUserId = user?._id || user?.id;
  const userReview = reviews.find((r) => {
    if (!currentUserId || !r || !r.user) return false;
    const reviewUserId = r.user._id || r.user.id || r.user;
    return String(reviewUserId) === String(currentUserId);
  });

  // Action handlers
  const handleStartCreateReview = () => {
    if (!user) {
      if (onOpenAuthModal) onOpenAuthModal();
      if (showToast) {
        showToast('info', 'Sign In Required', 'Please sign in to rate and review this movie.', '🔒');
      }
      return;
    }
    setIsFormOpen(true);
    setEditReviewId(null);
    setSelectedRating(5);
    setReviewText('');
    setFormValidation(null);
  };

  const handleStartEditReview = (rev) => {
    setIsFormOpen(true);
    setEditReviewId(rev._id);
    setSelectedRating(rev.rating || 5);
    setReviewText(rev.reviewText || rev.review || '');
    setFormValidation(null);
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditReviewId(null);
    setReviewText('');
    setSelectedRating(0);
    setFormValidation(null);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setFormValidation(null);

    if (!selectedRating || selectedRating < 1 || selectedRating > 5) {
      setFormValidation('Please select a rating between 1 and 5 stars.');
      return;
    }

    const trimmed = reviewText.trim();
    if (!trimmed || trimmed.length < 2) {
      setFormValidation('Please write a review with at least 2 characters.');
      return;
    }

    if (trimmed.length > 1000) {
      setFormValidation('Review text cannot exceed 1000 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (editReviewId) {
        // Edit existing review
        await updateMovieReview(editReviewId, {
          rating: selectedRating,
          reviewText: trimmed,
        });
        if (showToast) {
          showToast('success', 'Review Updated', 'Your review has been successfully updated.', '✓');
        }
      } else {
        // Create new review
        await createMovieReview(movieId, {
          rating: selectedRating,
          reviewText: trimmed,
        });
        if (showToast) {
          showToast('success', 'Review Published', 'Thank you for rating and reviewing this movie!', '★');
        }
      }
      handleCancelForm();
      await loadReviews();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to submit review. Please try again.';
      setFormValidation(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    setDeleting(true);
    try {
      await deleteMovieReview(reviewId);
      setDeleteConfirmId(null);
      if (showToast) {
        showToast('info', 'Review Deleted', 'Your review has been deleted.', '🗑️');
      }
      await loadReviews();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to delete review.';
      if (showToast) {
        showToast('error', 'Error', errMsg, '⚠️');
      }
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <div
      className="modal-backdrop-custom"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="movie-details-title"
    >
      <div
        ref={modalScrollRef}
        onScroll={handleScroll}
        className="modal-dialog-custom movie-details-dialog p-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Top Header Bar */}
        <header
          className={`movie-details-sticky-header ${isScrolled ? 'scrolled' : ''}`}
          aria-label="Modal controls"
        >
          {/* Left: iMovies branding at top, or Movie Title & Meta when scrolled */}
          <div className="d-flex align-items-center gap-2 overflow-hidden me-2">
            {isScrolled ? (
              <>
                <span className="badge-cert flex-shrink-0" style={{ fontSize: '0.72rem', padding: '2px 7px' }}>
                  {movie.certification}
                </span>
                <span
                  className="fw-bold text-white text-truncate brand-font"
                  style={{ fontSize: '1rem', letterSpacing: '-0.01em' }}
                  title={movie.title}
                >
                  {movie.title}
                </span>
                {movie.rating ? (
                  <span
                    className="badge bg-dark border border-warning border-opacity-40 text-warning d-none d-sm-inline-flex align-items-center gap-1 flex-shrink-0"
                    style={{ fontSize: '0.75rem', padding: '2px 7px' }}
                  >
                    ★ {movie.rating}
                  </span>
                ) : stats.averageRating > 0 ? (
                  <span
                    className="badge flex-shrink-0 d-none d-sm-inline-flex align-items-center gap-1"
                    style={{
                      background: 'rgba(248, 68, 100, 0.2)',
                      color: '#f84464',
                      border: '1px solid rgba(248, 68, 100, 0.4)',
                      fontSize: '0.75rem',
                      padding: '2px 7px',
                    }}
                  >
                    ★ {stats.averageRating}
                  </span>
                ) : null}
              </>
            ) : (
              <div className="d-flex align-items-center gap-2 text-secondary small fw-semibold">
                <span style={{ color: '#f84464', fontSize: '1.1rem' }}>🎬</span>
                <span className="text-light text-opacity-80">iMovies Cinema Details</span>
              </div>
            )}
          </div>

          {/* Right: Quick Book Button (when scrolled) + Watchlist Toggle + Close Button */}
          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            {isScrolled && (
              <button
                type="button"
                className="btn btn-bms-primary btn-sm px-3 py-1 fw-bold"
                style={{ fontSize: '0.82rem' }}
                onClick={() => {
                  onClose();
                  onBookMovie(movie);
                }}
                aria-label={`${isUpcoming ? 'Pre-book' : 'Book'} tickets for ${movie.title}`}
              >
                {isUpcoming ? '🔔 Pre-Book' : '🎟️ Book Now'}
              </button>
            )}

            {onToggleWatchlist && (
              <button
                type="button"
                className={`btn btn-sm p-0 rounded-circle d-inline-flex align-items-center justify-content-center ${
                  isInWatchlist ? 'text-danger' : 'text-light'
                }`}
                style={{
                  width: '34px',
                  height: '34px',
                  background: isInWatchlist ? 'rgba(248, 68, 100, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                  border: `1px solid ${isInWatchlist ? 'rgba(248, 68, 100, 0.4)' : 'rgba(255, 255, 255, 0.18)'}`,
                }}
                onClick={() => onToggleWatchlist(movie)}
                disabled={watchlistLoading}
                title={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                aria-label={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
              >
                {watchlistLoading ? (
                  <span className="spinner-border spinner-border-sm" style={{ width: '14px', height: '14px' }} />
                ) : (
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill={isInWatchlist ? '#f84464' : 'none'}
                    stroke={isInWatchlist ? '#f84464' : 'currentColor'}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                )}
              </button>
            )}

            <button
              type="button"
              className="movie-details-close-btn"
              onClick={onClose}
              aria-label="Close movie details modal"
            >
              ✕
            </button>
          </div>
        </header>

        {/* Modal Banner Hero Section */}
        <div
          className="movie-details-hero flex-shrink-0"
          style={{
            backgroundImage: `url("${posterSrc}")`,
            backgroundColor: '#0a0f1d',
          }}
        >
          <div className="movie-hero-scrim" />

          <div className="movie-hero-content d-flex flex-row gap-3 gap-md-4 align-items-start align-items-sm-center">
            {/* Poster thumbnail */}
            <div className="movie-hero-poster">
              <img
                src={posterSrc}
                alt={`${movie.title} poster`}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = bannerFallback;
                }}
              />
            </div>

            {/* Header Content */}
            <div className="flex-grow-1 min-w-0">
              <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                <span className="badge-cert">{movie.certification}</span>
                <span className="badge-tag">{movie.duration}</span>
                <span className={`badge-tag ${isUpcoming ? 'text-warning' : 'text-success'}`}>
                  {isUpcoming ? '● Upcoming Release' : '● Now In Theatres'}
                </span>
                {movie.formats && (
                  <span className="badge-tag d-none d-sm-inline-block">
                    {Array.isArray(movie.formats) ? movie.formats.join(', ') : movie.formats}
                  </span>
                )}
              </div>

              <h2 id="movie-details-title" className="display-6 fw-bold text-white mb-2 brand-font">
                {movie.title}
              </h2>

              {/* Rating / Anticipation Bar + Audience Rating Pill */}
              <div className="d-flex flex-wrap align-items-center gap-2 mb-2 mb-sm-3">
                {movie.rating ? (
                  <div className="d-inline-flex align-items-center gap-1 bg-dark bg-opacity-75 px-3 py-1 rounded-pill border border-warning border-opacity-30">
                    <span className="text-warning fs-5">★</span>
                    <span className="fw-bold text-white fs-6">{movie.rating}/10</span>
                    {movie.voteCount && (
                      <span className="text-secondary small">({movie.voteCount} votes)</span>
                    )}
                  </div>
                ) : (
                  <div className="d-inline-flex align-items-center gap-1 bg-dark bg-opacity-75 px-3 py-1 rounded-pill border border-warning border-opacity-30">
                    <span>🔥</span>
                    <span className="text-warning fw-semibold small">
                      Anticipated: {movie.expectedRating || 'High'}
                    </span>
                  </div>
                )}

                {/* Live Audience Rating Pill */}
                {stats.totalReviews > 0 && (
                  <div
                    className="d-inline-flex align-items-center gap-1 px-3 py-1 rounded-pill"
                    style={{
                      background: 'rgba(248, 68, 100, 0.15)',
                      border: '1px solid rgba(248, 68, 100, 0.4)',
                    }}
                    title={`${stats.totalReviews} verified audience reviews`}
                  >
                    <span style={{ color: '#ff4d6f' }}>★</span>
                    <span className="fw-bold text-white fs-6">{stats.averageRating}/5</span>
                    <span className="text-light text-opacity-75 small">
                      ({stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                )}

                {movie.languages && (
                  <span className="text-light small ms-1">
                    {Array.isArray(movie.languages) ? movie.languages.join(', ') : movie.languages}
                  </span>
                )}
              </div>

              {/* Tagline */}
              {movie.tagline && (
                <p className="text-light text-opacity-80 small mb-3 fst-italic d-none d-sm-block">
                  "{movie.tagline}"
                </p>
              )}

              {/* Action Buttons: Book CTA + Watchlist CTA */}
              <div className="pt-1 d-flex flex-wrap align-items-center gap-2 gap-sm-3">
                <button
                  type="button"
                  className="btn btn-bms-primary btn-lg px-4 fw-bold"
                  onClick={() => {
                    onClose();
                    onBookMovie(movie);
                  }}
                  aria-label={`${isUpcoming ? 'Pre-book' : 'Book'} tickets for ${movie.title}`}
                >
                  {isUpcoming ? '🔔 Pre-Book Tickets Now' : '🎟️ Book Tickets Now'}
                </button>

                {onToggleWatchlist && (
                  <button
                    type="button"
                    className={`btn btn-lg px-3 fw-semibold d-inline-flex align-items-center gap-2 ${
                      isInWatchlist ? 'btn-outline-danger text-danger' : 'btn-outline-light'
                    }`}
                    style={{
                      background: isInWatchlist
                        ? 'rgba(248, 68, 100, 0.12)'
                        : 'rgba(255, 255, 255, 0.05)',
                      borderColor: isInWatchlist ? '#f84464' : 'rgba(255, 255, 255, 0.25)',
                    }}
                    onClick={() => onToggleWatchlist(movie)}
                    disabled={watchlistLoading}
                    aria-label={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                  >
                    {watchlistLoading ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill={isInWatchlist ? '#f84464' : 'none'}
                        stroke={isInWatchlist ? '#f84464' : 'currentColor'}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    )}
                    <span>{isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="movie-details-body flex-grow-1">
          {/* ================================================================ */}
          {/* SECTION 1: MOVIE OVERVIEW & SYNOPSIS */}
          {/* ================================================================ */}
          <section className="movie-details-section" aria-labelledby="movie-overview-heading">
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="section-title-icon" aria-hidden="true">📖</span>
              <h4 id="movie-overview-heading" className="movie-section-heading mb-0">
                About the Movie
              </h4>
            </div>

            <p className="movie-synopsis-text">
              {movie.synopsis}
            </p>

            {movie.criticConsensus && (
              <div className="critic-consensus-card mt-3">
                <div className="d-flex align-items-start gap-2">
                  <span className="text-danger fs-5" aria-hidden="true">💬</span>
                  <div>
                    <span className="text-danger fw-bold small text-uppercase letter-spacing-1 d-block mb-1">
                      Critic Consensus
                    </span>
                    <p className="mb-0 text-light text-opacity-95 fst-italic" style={{ fontSize: '0.94rem', lineHeight: '1.6' }}>
                      "{movie.criticConsensus}"
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ================================================================ */}
          {/* SECTION 2: MOVIE INFORMATION & METADATA */}
          {/* ================================================================ */}
          <div className="movie-section-divider" />

          <section className="movie-details-section" aria-labelledby="movie-info-heading">
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="section-title-icon" aria-hidden="true">ℹ️</span>
              <h4 id="movie-info-heading" className="movie-section-heading mb-0">
                Movie Information
              </h4>
            </div>

            <div className="movie-metadata-grid">
              <div className="metadata-card">
                <span className="metadata-label">Release Date</span>
                <strong className="metadata-value">{movie.releaseDate || 'TBA'}</strong>
              </div>
              <div className="metadata-card">
                <span className="metadata-label">Duration</span>
                <strong className="metadata-value">{movie.duration || 'N/A'}</strong>
              </div>
              <div className="metadata-card">
                <span className="metadata-label">Certification</span>
                <strong className="metadata-value">{movie.certification || 'U'}</strong>
              </div>
              <div className="metadata-card">
                <span className="metadata-label">Languages</span>
                <strong className="metadata-value">
                  {Array.isArray(movie.languages) ? movie.languages.join(', ') : movie.languages || 'Telugu'}
                </strong>
              </div>
              <div className="metadata-card">
                <span className="metadata-label">Genres</span>
                <strong className="metadata-value">
                  {Array.isArray(movie.genres) ? movie.genres.join(', ') : movie.genres || 'Cinema'}
                </strong>
              </div>
              <div className="metadata-card">
                <span className="metadata-label">Director</span>
                <strong className="metadata-value">{movie.director || 'N/A'}</strong>
              </div>
              <div className="metadata-card">
                <span className="metadata-label">Music Director</span>
                <strong className="metadata-value">{movie.musicDirector || 'Various'}</strong>
              </div>
              {movie.formats && (
                <div className="metadata-card">
                  <span className="metadata-label">Formats</span>
                  <strong className="metadata-value">
                    {Array.isArray(movie.formats) ? movie.formats.join(', ') : movie.formats}
                  </strong>
                </div>
              )}
            </div>
          </section>

          {/* ================================================================ */}
          {/* SECTION 3: TOP CAST */}
          {/* ================================================================ */}
          <div className="movie-section-divider" />

          <section className="movie-details-section" aria-labelledby="movie-cast-heading">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <span className="section-title-icon" aria-hidden="true">🎭</span>
                <h4 id="movie-cast-heading" className="movie-section-heading mb-0">
                  Top Cast
                </h4>
              </div>
              {movie.cast && movie.cast.length > 0 && (
                <span className="text-secondary small fw-medium">
                  {movie.cast.length} {movie.cast.length === 1 ? 'Actor' : 'Actors'}
                </span>
              )}
            </div>

            {movie.cast && movie.cast.length > 0 ? (
              <div className="movie-cast-grid">
                {movie.cast.map((actor, idx) => (
                  <div key={idx} className="movie-cast-card" title={`${actor.name} as ${actor.role}`}>
                    <div className="cast-avatar">
                      {actor.initials || actor.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="cast-name" title={actor.name}>
                      {actor.name}
                    </div>
                    <div className="cast-role" title={`as ${actor.role}`}>
                      as {actor.role}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary small mb-0">Cast information not available.</p>
            )}
          </section>

          {/* ================================================================ */}
          {/* SECTION 4: AUDIENCE REVIEWS & RATINGS */}
          {/* ================================================================ */}
          <div className="movie-section-divider" />

          <section className="movie-details-section" aria-labelledby="movie-reviews-heading">
            {/* Reviews Section Header with Dynamic Action Button */}
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className="section-title-icon" aria-hidden="true">💬</span>
                  <h4 id="movie-reviews-heading" className="movie-section-heading mb-0">
                    Audience Reviews & Ratings
                  </h4>
                  {stats.totalReviews > 0 && (
                    <span className="badge rounded-pill reviews-count-badge">
                      {stats.totalReviews}
                    </span>
                  )}
                </div>
                <p className="text-secondary small mb-0">
                  Real experiences and ratings from verified filmgoers
                </p>
              </div>

              {!isFormOpen && (
                <div>
                  {userReview ? (
                    <button
                      type="button"
                      className="btn btn-outline-light btn-sm px-3 py-2 fw-semibold d-inline-flex align-items-center gap-2"
                      onClick={() => handleStartEditReview(userReview)}
                    >
                      <span>✏️</span>
                      <span>Edit Your Review</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-bms-primary btn-sm px-3 py-2 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm"
                      onClick={handleStartCreateReview}
                    >
                      <span>★</span>
                      <span>Rate & Review</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Overall Rating & Breakdown Card */}
            <div
              className="p-4 rounded-3 mb-4"
              style={{
                background: 'rgba(14, 21, 38, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {stats.totalReviews > 0 ? (
                <div className="row g-4 align-items-center">
                  {/* Left Column: Average Score */}
                  <div className="col-12 col-md-4 text-center text-md-start border-end-md border-secondary border-opacity-25">
                    <div className="d-flex align-items-baseline justify-content-center justify-content-md-start gap-2 mb-1">
                      <span className="display-4 fw-bold text-white brand-font">
                        {stats.averageRating}
                      </span>
                      <span className="text-secondary fs-5">/ 5</span>
                    </div>
                    <div className="d-flex justify-content-center justify-content-md-start gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          style={{
                            color: star <= Math.round(stats.averageRating) ? '#ffb800' : 'rgba(255,255,255,0.2)',
                            fontSize: '1.25rem',
                          }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <small className="text-secondary d-block">
                      Based on {stats.totalReviews} {stats.totalReviews === 1 ? 'audience rating' : 'audience ratings'}
                    </small>
                  </div>

                  {/* Right Column: 5-Star Distribution Bars */}
                  <div className="col-12 col-md-8">
                    <div className="d-flex flex-column gap-2">
                      {[5, 4, 3, 2, 1].map((ratingVal) => {
                        const count = stats.ratingBreakdown[ratingVal] || 0;
                        const percent = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                        return (
                          <div key={ratingVal} className="d-flex align-items-center gap-2">
                            <span
                              className="text-secondary small fw-medium text-end"
                              style={{ width: '42px', flexShrink: 0 }}
                            >
                              {ratingVal} ★
                            </span>
                            <div className="rating-bar-track">
                              <div
                                className="rating-bar-fill"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span
                              className="text-secondary small text-end"
                              style={{ width: '32px', flexShrink: 0 }}
                            >
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3">
                  <div className="display-6 mb-2">🌟</div>
                  <h6 className="text-white fw-bold mb-1">No reviews yet for this movie</h6>
                  <p className="text-secondary small mb-3">
                    Have you watched {movie.title}? Be the first to share your rating and review!
                  </p>
                  {!isFormOpen && (
                    <button
                      type="button"
                      className="btn btn-bms-primary btn-sm px-4 py-2 fw-semibold"
                      onClick={handleStartCreateReview}
                    >
                      ★ Rate & Review Now
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Unauthenticated Invitation Callout (when user is not logged in) */}
            {!user && (
              <div
                className="p-3 rounded-3 mb-4 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3"
                style={{
                  background: 'rgba(248, 68, 100, 0.08)',
                  border: '1px solid rgba(248, 68, 100, 0.25)',
                }}
              >
                <div className="d-flex align-items-center gap-3">
                  <span className="fs-3">🎬</span>
                  <div>
                    <strong className="text-white small d-block">Want to share your review?</strong>
                    <span className="text-light text-opacity-75 small">
                      Sign in to your iMovies account to rate and submit your review.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-light flex-shrink-0 fw-semibold"
                  style={{ borderColor: 'rgba(255,255,255,0.3)' }}
                  onClick={() => {
                    if (onOpenAuthModal) onOpenAuthModal();
                  }}
                >
                  Sign In to Review
                </button>
              </div>
            )}

            {/* Interactive Review Form (Create or Edit) */}
            {isFormOpen && (
              <div
                ref={formRef}
                className="review-form-container p-4 rounded-3 mb-4 position-relative"
                style={{
                  background: 'rgba(16, 24, 43, 0.95)',
                  border: '1px solid rgba(248, 68, 100, 0.4)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="text-white fw-bold mb-0">
                    {editReviewId ? '✏️ Edit Your Review' : '★ Write a Review'}
                  </h5>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary text-light py-0 px-2"
                    onClick={handleCancelForm}
                    aria-label="Cancel editing"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmitReview}>
                  {/* Star Rating Picker */}
                  <div className="mb-3">
                    <label className="text-secondary small fw-medium d-block mb-1">
                      Your Rating (1–5 Stars) <span className="text-danger">*</span>
                    </label>
                    <div className="d-flex align-items-center gap-2">
                      <div className="d-inline-flex" onMouseLeave={() => setHoverRating(0)}>
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isFilled = hoverRating ? star <= hoverRating : star <= selectedRating;
                          return (
                            <button
                              key={star}
                              type="button"
                              className={`review-star-btn ${isFilled ? 'active' : ''}`}
                              onClick={() => setSelectedRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                            >
                              ★
                            </button>
                          );
                        })}
                      </div>
                      <span className="small text-warning fw-semibold ms-2">
                        {getRatingLabel(hoverRating || selectedRating)}
                      </span>
                    </div>
                  </div>

                  {/* Review Textarea */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label htmlFor="user-review-text" className="text-secondary small fw-medium">
                        Your Review <span className="text-danger">*</span>
                      </label>
                      <small
                        className={`text-end ${
                          reviewText.length > 1000 ? 'text-danger fw-bold' : 'text-secondary'
                        }`}
                        style={{ fontSize: '0.75rem' }}
                      >
                        {reviewText.length} / 1000
                      </small>
                    </div>
                    <textarea
                      id="user-review-text"
                      className="form-control"
                      rows="4"
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="What did you think of the story, performances, cinematography, and music? Share your honest opinion..."
                      maxLength={1000}
                      style={{
                        backgroundColor: '#0a0f1d',
                        borderColor: 'rgba(255, 255, 255, 0.15)',
                        color: '#f8fafc',
                        fontSize: '0.92rem',
                        resize: 'none',
                      }}
                      required
                    />
                  </div>

                  {/* Form Validation Alert */}
                  {formValidation && (
                    <div className="alert alert-danger py-2 px-3 small mb-3 d-flex align-items-center gap-2">
                      <span>⚠️</span>
                      <span>{formValidation}</span>
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-light px-3"
                      onClick={handleCancelForm}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-sm btn-bms-primary px-4 fw-bold d-inline-flex align-items-center gap-2"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>{editReviewId ? 'Update Review' : 'Submit Review'}</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Error State */}
            {reviewError && (
              <div
                className="alert alert-dark d-flex align-items-center justify-content-between py-2 px-3 mb-4"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                }}
              >
                <div className="d-flex align-items-center gap-2 small">
                  <span>⚠️</span>
                  <span>{reviewError}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-light py-0 px-2"
                  style={{ fontSize: '0.78rem' }}
                  onClick={loadReviews}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading State */}
            {loadingReviews && (
              <div className="text-center py-4">
                <span className="spinner-border text-danger spinner-border-sm me-2" role="status" />
                <span className="text-secondary small">Loading audience reviews...</span>
              </div>
            )}

            {/* Reviews List */}
            {!loadingReviews && reviews.length > 0 && (
              <div className="d-flex flex-column gap-3">
                {reviews.map((rev) => {
                  const isAuthor =
                    currentUserId &&
                    rev.user &&
                    String(rev.user._id || rev.user.id || rev.user) === String(currentUserId);
                  const authorName = rev.user?.name || (isAuthor ? user?.name : 'Anonymous Filmgoer');
                  const initials = authorName
                    ? authorName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                    : 'U';

                  return (
                    <article
                      key={rev._id}
                      className={`review-card ${isAuthor ? 'user-own-review' : ''}`}
                    >
                      {/* Review Top Header: Author + Rating + Actions */}
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <div className={`review-avatar ${isAuthor ? 'user-avatar' : ''}`}>
                            {initials}
                          </div>
                          <div>
                            <div className="d-flex align-items-center gap-2">
                              <strong className="text-white small">{authorName}</strong>
                              {isAuthor && (
                                <span
                                  className="badge rounded-pill"
                                  style={{
                                    background: 'rgba(248, 68, 100, 0.25)',
                                    color: '#f84464',
                                    border: '1px solid rgba(248, 68, 100, 0.4)',
                                    fontSize: '0.68rem',
                                  }}
                                >
                                  You
                                </span>
                              )}
                            </div>
                            <small className="text-secondary" style={{ fontSize: '0.74rem' }}>
                              {formatDate(rev.createdAt)}
                            </small>
                          </div>
                        </div>

                        {/* Star Rating Badge */}
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill"
                            style={{
                              background: 'rgba(255, 184, 0, 0.12)',
                              border: '1px solid rgba(255, 184, 0, 0.3)',
                            }}
                          >
                            <span style={{ color: '#ffb800', fontSize: '0.85rem' }}>★</span>
                            <span className="fw-bold text-white" style={{ fontSize: '0.82rem' }}>
                              {rev.rating}/5
                            </span>
                          </div>

                          {/* Author Edit/Delete Controls */}
                          {isAuthor && (
                            <div className="d-flex align-items-center gap-1 ms-2">
                              <button
                                type="button"
                                className="review-action-btn"
                                onClick={() => handleStartEditReview(rev)}
                                title="Edit your review"
                                aria-label="Edit review"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                type="button"
                                className="review-action-btn delete-btn"
                                onClick={() => setDeleteConfirmId(rev._id)}
                                title="Delete your review"
                                aria-label="Delete review"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Review Text */}
                      <p className="review-text-content mt-2">
                        {rev.reviewText || rev.review}
                      </p>

                      {/* Inline Delete Confirmation Dialog */}
                      {deleteConfirmId === rev._id && (
                        <div
                          className="mt-3 p-3 rounded-3"
                          style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                          }}
                        >
                          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
                            <span className="small text-danger fw-semibold">
                              Are you sure you want to delete your review? This cannot be undone.
                            </span>
                            <div className="d-flex gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-light py-1 px-3"
                                style={{ fontSize: '0.78rem' }}
                                onClick={() => setDeleteConfirmId(null)}
                                disabled={deleting}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-danger py-1 px-3 fw-bold"
                                style={{ fontSize: '0.78rem' }}
                                onClick={() => handleDeleteReview(rev._id)}
                                disabled={deleting}
                              >
                                {deleting ? 'Deleting...' : 'Yes, Delete'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default MovieDetailsModal;
