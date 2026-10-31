import React, { useState, useEffect, useMemo } from 'react';
import { getPosterPlaceholder } from '../data/mockMovies';

function MovieCard({
  movie,
  onBook,
  onOpenDetails,
  isInWatchlist = false,
  onToggleWatchlist,
  watchlistLoading = false,
}) {
  const isUpcoming = movie.status === 'upcoming';
  const fallbackPoster = useMemo(() => getPosterPlaceholder(movie), [movie]);
  const primaryPoster = movie.poster || movie.posterUrl || movie.image || fallbackPoster;

  const [imgSrc, setImgSrc] = useState(primaryPoster);
  const [hasError, setHasError] = useState(false);

  // Synchronize poster when movie prop updates without resetting fallback
  useEffect(() => {
    setHasError(false);
    setImgSrc(movie.poster || movie.posterUrl || movie.image || fallbackPoster);
  }, [movie.id, movie.poster, movie.posterUrl, movie.image, fallbackPoster]);

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackPoster);
    }
  };

  return (
    <div className="movie-card h-100">
      {/* 2:3 Theatrical Poster Container */}
      <div
        className="poster-wrapper cursor-pointer"
        tabIndex={0}
        onClick={() => onOpenDetails(movie)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenDetails(movie);
          }
        }}
        title={`View details for ${movie.title}`}
        role="button"
        aria-label={`View details for ${movie.title}`}
        style={{ cursor: 'pointer' }}
      >
        <img
          src={imgSrc}
          alt={`${movie.title} official movie poster`}
          className="poster-img"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.onerror = null;
            handleImageError();
          }}
        />

        {/* Top Badges (Certification & Format) */}
        <div className="position-absolute top-0 start-0 p-2 d-flex gap-1" style={{ zIndex: 3 }}>
          {movie.certification && (
            <span className="badge-cert">{movie.certification}</span>
          )}
          {movie.formats && (
            <span className="badge-tag">{movie.formats[0]}</span>
          )}
        </div>

        {/* Watchlist Quick Toggle Button (Top Right) */}
        {onToggleWatchlist && (
          <button
            type="button"
            className="position-absolute top-0 end-0 m-2 btn btn-sm rounded-circle d-flex align-items-center justify-content-center p-0"
            style={{
              zIndex: 4,
              width: '32px',
              height: '32px',
              background: isInWatchlist ? 'rgba(248, 68, 100, 0.95)' : 'rgba(10, 15, 29, 0.75)',
              border: isInWatchlist ? '1px solid #ff4d6f' : '1px solid rgba(255, 255, 255, 0.25)',
              boxShadow: isInWatchlist ? '0 0 12px rgba(248, 68, 100, 0.6)' : '0 2px 8px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(6px)',
              transition: 'all 0.2s ease',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleWatchlist(movie);
            }}
            title={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            aria-label={isInWatchlist ? `Remove ${movie.title} from Watchlist` : `Add ${movie.title} to Watchlist`}
          >
            {watchlistLoading ? (
              <span className="spinner-border spinner-border-sm text-light" style={{ width: '12px', height: '12px' }} />
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill={isInWatchlist ? '#ffffff' : 'none'}
                stroke={isInWatchlist ? '#ffffff' : 'currentColor'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            )}
          </button>
        )}

        {/* Floating Glass Rating Banner at the base of the poster */}
        <div className="poster-rating-bar">
          {movie.rating ? (
            <div className="d-flex align-items-center gap-1 text-white">
              <span style={{ color: '#ffb800', fontSize: '0.95rem' }}>★</span>
              <span className="fw-bold fs-6">{movie.rating}/10</span>
              <span className="text-secondary small">({movie.voteCount})</span>
            </div>
          ) : (
            <div className="d-flex align-items-center gap-1 text-warning">
              <span>🔥</span>
              <span className="fw-semibold small">Anticipated: {movie.expectedRating}</span>
            </div>
          )}
          <span className="text-light text-opacity-75 small fw-medium">{movie.duration}</span>
        </div>
      </div>

      {/* Card Body & Metadata */}
      <div className="p-3 d-flex flex-column flex-grow-1 justify-content-between">
        <div>
          {/* Title */}
          <h5
            className="card-title-clamp mb-1"
            title={movie.title}
            style={{ fontSize: '1.05rem', cursor: 'pointer' }}
            onClick={() => onOpenDetails(movie)}
          >
            {movie.title}
          </h5>

          {/* Languages */}
          <p className="small text-secondary mb-1 text-truncate" title={movie.languages.join(', ')}>
            {movie.languages.join(' • ')}
          </p>

          {/* Genres */}
          <p className="small text-muted mb-2 text-truncate" style={{ fontSize: '0.8rem' }}>
            {movie.genres.join(' • ')}
          </p>

          {/* Status info: Playing / Releasing */}
          <div className="small mb-3 d-flex align-items-center justify-content-between">
            <span className="text-secondary" style={{ fontSize: '0.78rem' }}>
              {isUpcoming ? 'Release Date:' : 'Status:'}
            </span>
            <span
              className={`fw-semibold d-inline-flex align-items-center gap-1 ${isUpcoming ? 'text-warning' : 'text-success'}`}
              style={{ fontSize: '0.8rem' }}
            >
              {!isUpcoming && (
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    boxShadow: '0 0 6px #10b981',
                    display: 'inline-block',
                  }}
                />
              )}
              {isUpcoming ? movie.releaseDate : 'Now In Theatres'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex gap-2 pt-2 border-top border-white border-opacity-10">
          <button
            type="button"
            className="btn btn-bms-primary btn-sm flex-grow-1 py-2 fw-semibold"
            onClick={() => onBook(movie)}
            aria-label={`${isUpcoming ? 'Pre-book' : 'Book'} tickets for ${movie.title}`}
          >
            {isUpcoming ? '🔔 Pre-Book' : '🎟️ Book Tickets'}
          </button>
          <button
            type="button"
            className="btn btn-bms-outline btn-sm px-3 py-2 text-light"
            onClick={() => onOpenDetails(movie)}
            title="View Synopsis & Cast"
            aria-label={`View details and cast for ${movie.title}`}
          >
            ℹ️
          </button>
        </div>
      </div>
    </div>
  );
}

export default MovieCard;
