import React, { useState, useEffect, useMemo } from 'react';
import { getBannerPlaceholder } from '../data/mockMovies';

function HeroBanner({ movies, onBookMovie, onOpenDetails }) {
  // Prioritize top Indian blockbusters in the hero showcase
  const primaryHeroOrder = ['pushpa-2', 'kalki-2898-ad', 'devara-part-1', 'avengers-infinity-war'];

  const heroMovies = useMemo(() => {
    return [...movies]
      .filter((m) => m.isHero || primaryHeroOrder.includes(m.id))
      .sort((a, b) => {
        const idxA = primaryHeroOrder.indexOf(a.id);
        const idxB = primaryHeroOrder.indexOf(b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return (b.rating || 0) - (a.rating || 0);
      });
  }, [movies]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto slide every 7 seconds when not hovered
  useEffect(() => {
    if (heroMovies.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroMovies.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [heroMovies.length, isPaused]);

  if (!heroMovies || heroMovies.length === 0) return null;

  const activeMovie = heroMovies[currentIndex] || heroMovies[0];
  const defaultBanner = activeMovie.fallbackBanner || getBannerPlaceholder(activeMovie);
  const targetBanner = activeMovie?.banner || defaultBanner;

  const [bannerUrl, setBannerUrl] = useState(targetBanner);

  // Preload and validate banner image, fallback gracefully on error
  useEffect(() => {
    const primary = activeMovie?.banner;
    if (!primary || primary.startsWith('data:image/svg+xml')) {
      setBannerUrl(primary || defaultBanner);
      return;
    }
    const img = new Image();
    img.src = primary;
    img.onload = () => setBannerUrl(primary);
    img.onerror = () => setBannerUrl(defaultBanner);
  }, [activeMovie?.id, activeMovie?.banner, defaultBanner]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? heroMovies.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % heroMovies.length);
  };

  const accentColor = activeMovie?.accentColor || '#f84464';

  return (
    <div
      className="cinematic-hero-wrapper"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Featured Cinematic Movies Carousel"
    >
      {/* Background Cinematic Widescreen Artwork */}
      <div
        className="hero-backdrop-image"
        style={{
          backgroundImage: `url("${bannerUrl}")`,
        }}
      />

      {/* Multi-Directional Gradient Scrims */}
      <div className="hero-scrim-left" />
      <div className="hero-scrim-bottom" />
      <div className="hero-scrim-top" />

      {/* Dynamic Radial Ambient Glow from Movie Accent */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '25%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
          opacity: 0.18,
          pointerEvents: 'none',
          zIndex: 1,
          filter: 'blur(60px)',
        }}
      />

      {/* Content Container */}
      <div className="container hero-inner-container">
        <div className="row align-items-center justify-content-between g-4">
          {/* Left Column: Movie Story, Badges, Title & CTAs */}
          <div className="col-lg-7 col-xl-8">
            {/* Badges strip */}
            <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
              <span className="hero-badge-live">
                <span className="pulsing-dot" />
                LIVE IN ANANTAPUR CINEMAS
              </span>
              <span className="badge-cert">{activeMovie.certification}</span>
              <span className="badge-tag">{activeMovie.duration}</span>
              {activeMovie.formats && (
                <span className="badge-tag">
                  {activeMovie.formats.slice(0, 2).join(' • ')}
                </span>
              )}
              <span className="badge-tag" style={{ color: '#ffb800', borderColor: 'rgba(255, 184, 0, 0.3)' }}>
                4K LASER • ATMOS
              </span>
            </div>

            {/* Movie Title */}
            <h1 className="hero-title mb-2 brand-font">
              {activeMovie.title}
            </h1>

            {/* Rating & Languages */}
            <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
              <div
                className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill"
                style={{
                  background: 'rgba(10, 16, 32, 0.85)',
                  border: '1px solid rgba(255, 184, 0, 0.35)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                }}
              >
                <span style={{ color: '#ffb800', fontSize: '1.05rem' }}>★</span>
                <span className="fw-bold text-white fs-6">{activeMovie.rating}/10</span>
                <span className="text-secondary small">({activeMovie.voteCount} Votes)</span>
              </div>
              <span className="text-secondary d-none d-sm-inline">•</span>
              <span className="text-light fw-medium small">
                {activeMovie.languages.slice(0, 4).join(', ')}
              </span>
              <span className="text-secondary d-none d-sm-inline">•</span>
              <span className="text-secondary small">
                {activeMovie.genres.slice(0, 3).join(' • ')}
              </span>
            </div>

            {/* Tagline & Synopsis */}
            <p
              className="text-light text-opacity-90 mb-4 d-none d-sm-block"
              style={{
                maxWidth: '680px',
                fontSize: '1.05rem',
                lineHeight: '1.6',
                textShadow: '0 2px 10px rgba(0,0,0,0.8)',
              }}
            >
              <strong style={{ color: '#ff4d6f' }}>"{activeMovie.tagline}"</strong> — {activeMovie.synopsis.slice(0, 160)}...
            </p>

            {/* Primary Action Buttons */}
            <div className="d-flex flex-wrap align-items-center gap-3 pt-1">
              <button
                type="button"
                className="btn btn-bms-primary btn-lg px-4 py-3"
                onClick={() => onBookMovie(activeMovie)}
                aria-label={`Book Tickets for ${activeMovie.title}`}
              >
                <span style={{ fontSize: '1.15rem' }}>🎟️</span>
                <span className="fw-bold">Book Tickets</span>
              </button>

              <button
                type="button"
                className="btn btn-bms-outline btn-lg px-4 py-3"
                onClick={() => onOpenDetails(activeMovie)}
                aria-label={`View Details, Cast & Synopsis for ${activeMovie.title}`}
              >
                <span>ℹ️</span>
                <span>Explore Details & Cast</span>
              </button>
            </div>
          </div>

          {/* Right Column: Featured Poster Preview (Desktop) */}
          <div className="col-lg-5 col-xl-4 d-none d-lg-flex justify-content-end">
            <div
              className="position-relative cursor-pointer"
              onClick={() => onOpenDetails(activeMovie)}
              title={`View ${activeMovie.title} details`}
              style={{
                width: '210px',
                height: '310px',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: `0 24px 50px rgba(0,0,0,0.9), 0 0 35px ${accentColor}44`,
                border: '2px solid rgba(255, 255, 255, 0.22)',
                transition: 'all 0.35s ease',
              }}
            >
              <img
                src={activeMovie.poster || activeMovie.posterUrl || activeMovie.image}
                alt={`${activeMovie.title} poster`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = defaultBanner;
                }}
              />
              <div
                className="position-absolute bottom-0 start-0 end-0 p-3 text-center"
                style={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.95), transparent)',
                }}
              >
                <span className="btn btn-sm btn-outline-light rounded-pill px-3 py-1" style={{ fontSize: '0.75rem' }}>
                  Quick Preview 🔍
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Interactive Blockbuster Switcher Rail & Controls */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-end gap-3 mt-4 pt-3 border-top border-white border-opacity-10">
          {/* Film Thumbnail Strip */}
          <div className="d-flex align-items-center gap-2 overflow-x-auto pb-1">
            <span className="text-secondary small fw-bold text-uppercase me-2 d-none d-md-inline" style={{ letterSpacing: '0.06em' }}>
              Spotlight:
            </span>
            {heroMovies.slice(0, 4).map((movie, idx) => (
              <div
                key={movie.id}
                className={`hero-rail-item ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(idx)}
                title={`Switch to ${movie.title}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setCurrentIndex(idx);
                  }
                }}
              >
                <img
                  src={movie.poster || movie.posterUrl || movie.image}
                  alt={movie.title}
                />
                <div
                  className="position-absolute bottom-0 start-0 end-0 px-2 py-1"
                  style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.92), transparent)',
                    fontSize: '0.68rem',
                    fontWeight: '700',
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {movie.title}
                </div>
              </div>
            ))}
          </div>

          {/* Carousel Arrows */}
          <div className="d-flex align-items-center gap-2 ms-auto">
            <button
              type="button"
              className="btn btn-sm btn-outline-light rounded-circle p-2 d-flex align-items-center justify-content-center"
              style={{
                width: '40px',
                height: '40px',
                background: 'rgba(10, 16, 32, 0.75)',
                borderColor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(8px)',
              }}
              onClick={handlePrev}
              aria-label="Previous Featured Movie"
            >
              ‹
            </button>
            <span className="text-secondary small fw-bold px-2">
              <span className="text-white">{currentIndex + 1}</span> / {heroMovies.length}
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline-light rounded-circle p-2 d-flex align-items-center justify-content-center"
              style={{
                width: '40px',
                height: '40px',
                background: 'rgba(10, 16, 32, 0.75)',
                borderColor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(8px)',
              }}
              onClick={handleNext}
              aria-label="Next Featured Movie"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroBanner;
