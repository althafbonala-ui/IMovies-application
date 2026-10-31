import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWatchlist, removeFromWatchlist } from '../services/watchlistService';
import { getPosterPlaceholder } from '../data/mockMovies';

/**
 * WatchlistPage Component
 *
 * Dedicated personal movie watchlist page:
 * - Persisted in MongoDB per authenticated user
 * - Responsive grid of saved movie cards
 * - Quick "Book Tickets" and "Remove" actions
 * - Search & status filters (All, Now Showing, Upcoming)
 * - Empty, Loading, and Authentication prompts
 */
function WatchlistPage({
  user,
  authLoading = false,
  onOpenAuthModal,
  showToast,
  onBookMovie,
  onOpenDetails,
  onWatchlistChanged,
}) {
  const navigate = useNavigate();

  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'now_showing' | 'upcoming'

  // Fetch user's saved watchlist from backend
  const fetchUserWatchlist = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const response = await getWatchlist();
      if (response && response.success && Array.isArray(response.data)) {
        setWatchlist(response.data);
      } else {
        setWatchlist([]);
      }
    } catch (err) {
      const status = err.response?.status;
      let msg = err.response?.data?.message || 'Unable to retrieve your watchlist.';
      if (status === 401) {
        msg = 'Your session has expired. Please sign in again to view your watchlist.';
      } else if (!err.response) {
        msg = 'Network connection error. Please verify your backend server connectivity.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load watchlist on mount or when user changes
  useEffect(() => {
    if (user) {
      fetchUserWatchlist();
    } else {
      setWatchlist([]);
      setLoading(false);
      setError(null);
    }
  }, [user, fetchUserWatchlist]);

  // Handle removing movie from watchlist
  const handleRemove = async (movie) => {
    const movieId = movie._id || movie.id || movie.slug;
    if (!movieId) return;

    setActionLoadingId(movieId);
    try {
      const response = await removeFromWatchlist(movieId);
      if (response && response.success) {
        setWatchlist((prev) =>
          prev.filter(
            (m) =>
              (m._id && m._id.toString() !== movieId.toString()) &&
              (m.id && m.id.toString() !== movieId.toString()) &&
              (m.slug !== movieId)
          )
        );
        if (showToast) {
          showToast(
            'info',
            'Removed from Watchlist',
            `"${movie.title}" has been removed from your watchlist.`,
            '🗑️'
          );
        }
        if (onWatchlistChanged) {
          onWatchlistChanged();
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to remove movie from watchlist.';
      if (showToast) {
        showToast('error', 'Action Failed', msg, '⚠️');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter watchlist by search query and status
  const filteredWatchlist = useMemo(() => {
    return watchlist.filter((movie) => {
      if (!movie) return false;

      const matchesStatus =
        statusFilter === 'all' || movie.status === statusFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        (movie.title && movie.title.toLowerCase().includes(q)) ||
        (movie.languages &&
          movie.languages.some((lang) => lang.toLowerCase().includes(q))) ||
        (movie.genres &&
          movie.genres.some((g) => g.toLowerCase().includes(q)));

      return matchesStatus && matchesSearch;
    });
  }, [watchlist, searchQuery, statusFilter]);

  return (
    <div className="watchlist-page py-4" style={{ minHeight: '80vh' }}>
      <div className="container">
        {/* Breadcrumb Header */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0" style={{ fontSize: '0.85rem' }}>
              <li className="breadcrumb-item">
                <button
                  type="button"
                  className="btn btn-link p-0 text-secondary text-decoration-none border-0 bg-transparent"
                  onClick={() => navigate('/')}
                >
                  Home
                </button>
              </li>
              <li className="breadcrumb-item active text-danger fw-semibold" aria-current="page">
                My Watchlist
              </li>
            </ol>
          </nav>

          {user && (
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-dark border border-secondary text-light px-3 py-2" style={{ fontSize: '0.78rem' }}>
                🔖 {watchlist.length} {watchlist.length === 1 ? 'Movie' : 'Movies'} Saved
              </span>
            </div>
          )}
        </div>

        {/* Hero Banner Section */}
        <div
          className="p-4 p-md-5 rounded-4 mb-4 position-relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #111a2e 0%, #080c16 100%)',
            border: '1px solid rgba(248, 68, 100, 0.25)',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
          }}
        >
          <div className="position-relative" style={{ zIndex: 2 }}>
            <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3" style={{ background: 'rgba(248, 68, 100, 0.15)', border: '1px solid rgba(248, 68, 100, 0.35)' }}>
              <span style={{ fontSize: '0.9rem' }}>🎬</span>
              <span className="text-danger small fw-bold text-uppercase" style={{ letterSpacing: '0.08em' }}>
                Personal Movie Collection
              </span>
            </div>

            <h1 className="display-6 fw-bold text-white mb-2 brand-font">
              My <span style={{ color: '#f84464' }}>Watchlist</span>
            </h1>
            <p className="text-secondary mb-0 small" style={{ maxWidth: '600px', lineHeight: '1.6' }}>
              Keep track of blockbusters you want to experience on the big screen. Add now showing and upcoming releases to reserve tickets the moment showtimes open.
            </p>
          </div>
        </div>

        {/* Not Authenticated State */}
        {!user && !authLoading && (
          <div
            className="text-center py-5 p-4 rounded-4"
            style={{
              background: '#0d1424',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
            }}
          >
            <div
              className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
              style={{
                width: '70px',
                height: '70px',
                background: 'rgba(248, 68, 100, 0.12)',
                border: '1px solid rgba(248, 68, 100, 0.3)',
              }}
            >
              <span style={{ fontSize: '2rem' }}>🔖</span>
            </div>
            <h3 className="text-white fw-bold mb-2">Sign In to View Your Watchlist</h3>
            <p className="text-secondary small mb-4" style={{ maxWidth: '440px', margin: '0 auto' }}>
              Your watchlist is stored safely in your personal account so you can access it across all your devices.
            </p>
            <div className="d-flex justify-content-center gap-3">
              <button
                type="button"
                className="btn btn-bms-primary px-4 py-2 fw-semibold"
                onClick={onOpenAuthModal}
              >
                Sign In / Create Account
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary px-4 py-2"
                onClick={() => navigate('/')}
              >
                Browse Movies
              </button>
            </div>
          </div>
        )}

        {/* Loading Spinner State */}
        {(loading || authLoading) && (
          <div className="text-center py-5">
            <div className="spinner-border text-danger" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading watchlist...</span>
            </div>
            <p className="text-secondary small mt-3">Loading your saved movies...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div
            className="p-4 rounded-3 text-center my-4"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <span style={{ fontSize: '2rem' }}>⚠️</span>
            <h5 className="text-white mt-2">Could Not Load Watchlist</h5>
            <p className="text-secondary small mb-3">{error}</p>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm px-4"
              onClick={fetchUserWatchlist}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Authenticated & Loaded Content */}
        {user && !loading && !error && (
          <>
            {/* Filter and Search Bar (Only shown if watchlist has items or active search) */}
            {(watchlist.length > 0 || searchQuery) && (
              <div
                className="p-3 rounded-3 mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3"
                style={{
                  background: '#0d1424',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                {/* Search input */}
                <div className="position-relative flex-grow-1" style={{ maxWidth: '360px' }}>
                  <input
                    type="text"
                    className="form-control form-control-sm text-white"
                    placeholder="Search saved movies or genres..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      paddingLeft: '32px',
                    }}
                  />
                  <span
                    className="position-absolute start-0 top-50 translate-middle-y ms-2 text-secondary"
                    style={{ fontSize: '0.85rem' }}
                  >
                    🔍
                  </span>
                  {searchQuery && (
                    <button
                      type="button"
                      className="btn btn-sm text-secondary position-absolute end-0 top-50 translate-middle-y me-1 p-0 border-0"
                      onClick={() => setSearchQuery('')}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Status Filter Buttons */}
                <div className="d-flex align-items-center gap-2">
                  <span className="text-secondary small fw-semibold">Status:</span>
                  <div className="btn-group btn-group-sm" role="group">
                    <button
                      type="button"
                      className={`btn ${statusFilter === 'all' ? 'btn-danger' : 'btn-dark'}`}
                      onClick={() => setStatusFilter('all')}
                    >
                      All ({watchlist.length})
                    </button>
                    <button
                      type="button"
                      className={`btn ${statusFilter === 'now_showing' ? 'btn-danger' : 'btn-dark'}`}
                      onClick={() => setStatusFilter('now_showing')}
                    >
                      Now Showing ({watchlist.filter((m) => m.status === 'now_showing').length})
                    </button>
                    <button
                      type="button"
                      className={`btn ${statusFilter === 'upcoming' ? 'btn-danger' : 'btn-dark'}`}
                      onClick={() => setStatusFilter('upcoming')}
                    >
                      Upcoming ({watchlist.filter((m) => m.status === 'upcoming').length})
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {watchlist.length === 0 && (
              <div
                className="text-center py-5 p-4 rounded-4"
                style={{
                  background: '#0d1424',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div
                  className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                  style={{
                    width: '76px',
                    height: '76px',
                    background: 'rgba(248, 68, 100, 0.1)',
                    border: '1px solid rgba(248, 68, 100, 0.25)',
                  }}
                >
                  <span style={{ fontSize: '2.2rem' }}>🔖</span>
                </div>
                <h3 className="text-white fw-bold mb-2">Your Watchlist is Empty</h3>
                <p className="text-secondary small mb-4" style={{ maxWidth: '460px', margin: '0 auto', lineHeight: '1.6' }}>
                  Explore trending blockbusters playing in theatres or upcoming releases, and tap the bookmark icon on any movie to save it here.
                </p>
                <button
                  type="button"
                  className="btn btn-bms-primary px-4 py-2 fw-semibold"
                  onClick={() => navigate('/')}
                >
                  🎬 Explore Now Showing Movies
                </button>
              </div>
            )}

            {/* No Search Results State */}
            {watchlist.length > 0 && filteredWatchlist.length === 0 && (
              <div
                className="text-center py-5 p-4 rounded-4"
                style={{
                  background: '#0d1424',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <span style={{ fontSize: '2rem' }}>🔍</span>
                <h5 className="text-white mt-2">No Matching Movies in Watchlist</h5>
                <p className="text-secondary small mb-3">
                  No saved movies matched "{searchQuery}".
                </p>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                >
                  Reset Watchlist Filters
                </button>
              </div>
            )}

            {/* Movies Grid */}
            {filteredWatchlist.length > 0 && (
              <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
                {filteredWatchlist.map((movie) => {
                  const movieId = movie._id || movie.id || movie.slug;
                  const isUpcoming = movie.status === 'upcoming';
                  const isRemoving = actionLoadingId === movieId;
                  const posterUrl = movie.poster || movie.posterUrl || movie.image || getPosterPlaceholder(movie);

                  return (
                    <div key={movieId} className="col">
                      <div className="movie-card h-100 d-flex flex-column">
                        {/* Poster with badges */}
                        <div
                          className="poster-wrapper cursor-pointer position-relative"
                          onClick={() => onOpenDetails && onOpenDetails(movie)}
                          style={{ cursor: 'pointer' }}
                          title={`View details for ${movie.title}`}
                        >
                          <img
                            src={posterUrl}
                            alt={`${movie.title} poster`}
                            className="poster-img"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = getPosterPlaceholder(movie);
                            }}
                          />

                          {/* Top Badges */}
                          <div className="position-absolute top-0 start-0 p-2 d-flex gap-1" style={{ zIndex: 3 }}>
                            {movie.certification && (
                              <span className="badge-cert">{movie.certification}</span>
                            )}
                            {movie.formats && movie.formats[0] && (
                              <span className="badge-tag">{movie.formats[0]}</span>
                            )}
                          </div>

                          {/* Remove button badge on top-right */}
                          <button
                            type="button"
                            className="position-absolute top-0 end-0 m-2 btn btn-sm rounded-circle d-flex align-items-center justify-content-center p-0"
                            style={{
                              zIndex: 4,
                              width: '32px',
                              height: '32px',
                              background: 'rgba(10, 15, 29, 0.85)',
                              border: '1px solid rgba(255, 255, 255, 0.25)',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                              backdropFilter: 'blur(6px)',
                              transition: 'all 0.2s ease',
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemove(movie);
                            }}
                            disabled={isRemoving}
                            title="Remove from Watchlist"
                            aria-label={`Remove ${movie.title} from Watchlist`}
                          >
                            {isRemoving ? (
                              <span className="spinner-border spinner-border-sm text-light" style={{ width: '12px', height: '12px' }} />
                            ) : (
                              <span className="text-white" style={{ fontSize: '0.8rem', lineHeight: 1 }}>✕</span>
                            )}
                          </button>

                          {/* Rating / Anticipation Banner */}
                          <div className="poster-rating-bar">
                            {movie.rating ? (
                              <div className="d-flex align-items-center gap-1 text-white">
                                <span style={{ color: '#ffb800', fontSize: '0.95rem' }}>★</span>
                                <span className="fw-bold fs-6">{movie.rating}/10</span>
                                {movie.voteCount && (
                                  <span className="text-secondary small">({movie.voteCount})</span>
                                )}
                              </div>
                            ) : (
                              <div className="d-flex align-items-center gap-1 text-warning">
                                <span>🔥</span>
                                <span className="fw-semibold small">
                                  {movie.expectedRating || 'Anticipated'}
                                </span>
                              </div>
                            )}
                            <span className="text-light text-opacity-75 small fw-medium">
                              {movie.duration || 'TBA'}
                            </span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-3 d-flex flex-column flex-grow-1 justify-content-between">
                          <div>
                            <h5
                              className="card-title-clamp mb-1 cursor-pointer"
                              title={movie.title}
                              style={{ fontSize: '1.05rem', cursor: 'pointer' }}
                              onClick={() => onOpenDetails && onOpenDetails(movie)}
                            >
                              {movie.title}
                            </h5>

                            {movie.languages && (
                              <p className="small text-secondary mb-1 text-truncate" title={movie.languages.join(', ')}>
                                {movie.languages.join(' • ')}
                              </p>
                            )}

                            {movie.genres && (
                              <p className="small text-muted mb-2 text-truncate" style={{ fontSize: '0.8rem' }}>
                                {movie.genres.join(' • ')}
                              </p>
                            )}

                            {/* Status info */}
                            <div className="small mb-3 d-flex align-items-center justify-content-between">
                              <span className="text-secondary" style={{ fontSize: '0.78rem' }}>
                                {isUpcoming ? 'Release Date:' : 'Status:'}
                              </span>
                              <span
                                className={`fw-semibold ${isUpcoming ? 'text-warning' : 'text-success'}`}
                                style={{ fontSize: '0.8rem' }}
                              >
                                {isUpcoming ? movie.releaseDate : 'Now In Theatres'}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons: Book Tickets & Remove */}
                          <div className="d-flex gap-2 pt-2 border-top border-white border-opacity-10">
                            <button
                              type="button"
                              className="btn btn-bms-primary btn-sm flex-grow-1 py-2 fw-semibold"
                              onClick={() => onBookMovie && onBookMovie(movie)}
                              aria-label={`${isUpcoming ? 'Pre-book' : 'Book'} tickets for ${movie.title}`}
                            >
                              {isUpcoming ? '🔔 Pre-Book' : '🎟️ Book Tickets'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm px-2 py-2"
                              onClick={() => handleRemove(movie)}
                              disabled={isRemoving}
                              title="Remove from Watchlist"
                              aria-label={`Remove ${movie.title}`}
                            >
                              {isRemoving ? (
                                <span className="spinner-border spinner-border-sm" style={{ width: '12px', height: '12px' }} />
                              ) : (
                                '🗑️'
                              )}
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
    </div>
  );
}

export default WatchlistPage;
