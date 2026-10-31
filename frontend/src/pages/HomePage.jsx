import React, { useState } from 'react';
import HeroBanner from '../components/HeroBanner';
import MovieCard from '../components/MovieCard';
import { MOVIES, THEATRES_ANANTAPUR } from '../data/mockMovies';

/**
 * HomePage Component
 *
 * Full featured cinema homepage:
 * - Live catalog status indicator
 * - Hero carousel of trending blockbusters
 * - Interactive filter pills (languages, genres)
 * - Search results view with instant feedback
 * - Now Showing in cinemas grid
 * - iMovies Stream 4K banner
 * - Special Screenings & Events (Fan celebrations & IMAX festivals)
 * - Upcoming Indian blockbusters
 * - Top Cinema Theatres & showtimes in selected city
 */
function HomePage({
  catalogSource,
  moviesList,
  theatresList,
  selectedCity,
  searchQuery,
  setSearchQuery,
  selectedLanguage,
  setSelectedLanguage,
  selectedGenre,
  setSelectedGenre,
  filteredMovies,
  nowShowingMovies,
  upcomingMovies,
  languagesList,
  genresList,
  handleOpenBooking,
  handleOpenDetails,
  onOpenCitySelector,
  watchlistIds = [],
  onToggleWatchlist,
  watchlistActionLoading = null,
}) {
  const [streamNotice, setStreamNotice] = useState(false);

  const isMovieInWatchlist = (movie) => {
    if (!watchlistIds || !movie) return false;
    const mId = movie._id ? movie._id.toString() : '';
    const slug = movie.slug || '';
    const id = movie.id ? movie.id.toString() : '';
    return watchlistIds.some((wid) => wid === mId || wid === slug || wid === id);
  };

  return (
    <>


      {/* Large Featured Movie Hero Carousel */}
      {searchQuery.trim() === '' && (
        <HeroBanner
          movies={moviesList}
          onBookMovie={handleOpenBooking}
          onOpenDetails={handleOpenDetails}
        />
      )}

      {/* Filter Pills & Section Controls */}
      <div className="container my-4">
        <div className="filter-rail-wrapper d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
          {/* Language filter pills */}
          <div className="d-flex align-items-center gap-2 overflow-x-auto hide-scrollbar pb-1 pb-lg-0">
            <span className="text-secondary small fw-bold text-uppercase me-1" style={{ letterSpacing: '0.06em' }}>
              Languages:
            </span>
            {languagesList.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setSelectedLanguage(lang)}
                className={`filter-pill ${selectedLanguage === lang ? 'active' : ''}`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Genre filter pills */}
          <div className="d-flex align-items-center gap-2 overflow-x-auto hide-scrollbar pb-1 pb-lg-0">
            <span className="text-secondary small fw-bold text-uppercase me-1" style={{ letterSpacing: '0.06em' }}>
              Genres:
            </span>
            {genresList.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => setSelectedGenre(genre)}
                className={`filter-pill ${selectedGenre === genre ? 'active' : ''}`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Results View if active */}
      {searchQuery.trim() !== '' ? (
        <div className="container mb-5">
          <div
            className="d-flex justify-content-between align-items-center p-3 rounded-3 mb-4"
            style={{ background: 'rgba(248, 68, 100, 0.1)', border: '1px solid rgba(248, 68, 100, 0.3)' }}
          >
            <div>
              <span className="text-white">Showing search results for: </span>
              <strong className="text-danger">"{searchQuery}"</strong>
              <span className="text-secondary small ms-2">({filteredMovies.length} movies found)</span>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-light"
              onClick={() => setSearchQuery('')}
            >
              Clear Search
            </button>
          </div>

          {filteredMovies.length > 0 ? (
            <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
              {filteredMovies.map((movie) => (
                <div key={movie.id} className="col">
                  <MovieCard
                    movie={movie}
                    onBook={handleOpenBooking}
                    onOpenDetails={handleOpenDetails}
                    isInWatchlist={isMovieInWatchlist(movie)}
                    onToggleWatchlist={onToggleWatchlist}
                    watchlistLoading={watchlistActionLoading === (movie._id || movie.id || movie.slug)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div
              className="text-center py-5 p-4 rounded-4"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
            >
              <span style={{ fontSize: '2.5rem' }} aria-hidden="true">🔍</span>
              <h5 className="text-white mt-2">No movies match your search</h5>
              <p className="text-secondary small">
                Try searching by actor, director, genre (Action, Sci-Fi), or language (Telugu, Hindi).
              </p>
              <button
                type="button"
                className="btn btn-bms-outline btn-sm"
                onClick={() => {
                  setSelectedLanguage('All');
                  setSelectedGenre('All');
                  setSearchQuery('');
                }}
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Section 1: Now Showing Movies */}
          <section className="container mb-5" id="now-showing">
            <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4 pb-2 border-bottom border-white border-opacity-10">
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span style={{ fontSize: '1.35rem' }} aria-hidden="true">🔥</span>
                  <h2 className="h3 fw-bold text-white mb-0 brand-font">Now Showing in Cinemas</h2>
                  <span
                    className="badge px-2 py-1 small"
                    style={{
                      background: 'rgba(248, 68, 100, 0.16)',
                      color: '#ff4d6f',
                      border: '1px solid rgba(248, 68, 100, 0.4)',
                      fontWeight: '700',
                    }}
                  >
                    {selectedCity.name}
                  </span>
                </div>
                <p className="text-secondary small mb-0">
                  Trending Indian blockbusters playing across 4K Dolby Atmos screens in {selectedCity.name}
                </p>
              </div>
              <div className="text-secondary small">
                <span className="text-danger fw-bold">{nowShowingMovies.length}</span> Movies Available
              </div>
            </div>

            {nowShowingMovies.length > 0 ? (
              <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
                {nowShowingMovies.map((movie) => (
                  <div key={movie.id} className="col">
                    <MovieCard
                      movie={movie}
                      onBook={handleOpenBooking}
                      onOpenDetails={handleOpenDetails}
                      isInWatchlist={isMovieInWatchlist(movie)}
                      onToggleWatchlist={onToggleWatchlist}
                      watchlistLoading={watchlistActionLoading === (movie._id || movie.id || movie.slug)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5 p-4 rounded-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '2.5rem' }} aria-hidden="true">🔍</span>
                <h5 className="text-white mt-2">No movies match your filters</h5>
                <p className="text-secondary small">
                  Try selecting a different language or clearing your filters.
                </p>
                <button
                  type="button"
                  className="btn btn-bms-outline btn-sm"
                  onClick={() => {
                    setSelectedLanguage('All');
                    setSelectedGenre('All');
                    setSearchQuery('');
                  }}
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </section>

          {/* Section 2: BookMyShow Cinema Special Stream Banner */}
          <section className="container mb-5" id="stream">
            <div
              className="p-4 p-md-5 rounded-4 position-relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #18223c 0%, #0d1424 100%)',
                border: '1px solid rgba(248, 68, 100, 0.3)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              }}
            >
              <div className="row align-items-center g-4">
                <div className="col-lg-8">
                  <div className="d-inline-flex align-items-center gap-2 mb-2">
                    <span className="badge bg-danger text-white px-2 py-1">iMovies STREAM</span>
                    <span className="badge bg-dark text-warning border border-warning border-opacity-25">NEW PREMIERES EVERY FRIDAY</span>
                  </div>
                  <h3 className="display-6 fw-bold text-white mb-2 brand-font">
                    Watch Big Screen Blockbusters At Home
                  </h3>
                  <p className="text-light text-opacity-80 mb-3" style={{ maxWidth: '620px' }}>
                    Rent or buy newly released cinema hits directly in Ultra HD 4K with immersive Dolby Atmos surround sound.
                  </p>
                  <div className="d-flex flex-wrap gap-2">
                    <span className="badge-tag">No Subscription Needed</span>
                    <span className="badge-tag">Pay Only For What You Watch</span>
                    <span className="badge-tag">Multi-Device 4K Playback</span>
                  </div>
                </div>
                <div className="col-lg-4 text-lg-end">
                  {streamNotice && (
                    <div className="text-warning small mb-2 text-lg-end">
                      ℹ️ <strong>Demo Stream:</strong> Streaming catalog is a preview showcase in this prototype.
                    </div>
                  )}
                  <button
                    type="button"
                    className="btn btn-bms-primary btn-lg px-4"
                    onClick={() => setStreamNotice(!streamNotice)}
                  >
                    Explore Stream Catalog
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Special Screenings & Events in Anantapur */}
          <section className="container mb-5" id="events">
            <div className="d-flex justify-content-between align-items-end mb-4">
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span style={{ fontSize: '1.25rem' }} aria-hidden="true">🎉</span>
                  <h2 className="h3 fw-bold text-white mb-0 brand-font">Special Screenings & Events</h2>
                </div>
                <p className="text-secondary small mb-0">
                  Exclusive IMAX festivals, midnight premieres & cinema celebrations in {selectedCity.name}
                </p>
              </div>
              <div className="text-secondary small d-none d-sm-block">
                <span className="text-danger fw-bold">3</span> Events Scheduled
              </div>
            </div>

            <div className="row g-4">
              <div className="col-md-4">
                <div className="cinema-event-card p-4 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-danger text-white">IMAX RETROSPECTIVE</span>
                      <span className="text-secondary small">Sat & Sun</span>
                    </div>
                    <h4 className="fw-bold text-white mb-2 brand-font">Marvel Classics 4K Marathon</h4>
                    <p className="text-secondary small mb-3">
                      Experience the Infinity Saga re-mastered natively for giant IMAX screens at Sudha Complex.
                    </p>
                    <div className="small text-light mb-3">
                      📍 <strong>Sudha Complex 4K</strong> • Dolby Atmos
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-bms-outline w-100 py-2 btn-sm text-light fw-semibold"
                    onClick={() => handleOpenBooking(MOVIES[6] || MOVIES[0])}
                  >
                    🎟️ Pre-Book Event Pass
                  </button>
                </div>
              </div>

              <div className="col-md-4">
                <div className="cinema-event-card p-4 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-warning text-dark fw-bold">MIDNIGHT PREMIERE</span>
                      <span className="text-secondary small">Fan Celebration</span>
                    </div>
                    <h4 className="fw-bold text-white mb-2 brand-font">Pushpa 2 Midnight Gala</h4>
                    <p className="text-secondary small mb-3">
                      Special 01:00 AM celebration shows featuring massive confetti cannons, DJ beats, and fan tributes.
                    </p>
                    <div className="small text-light mb-3">
                      📍 <strong>SV Multiplex Screen 1</strong> • Anantapur
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-bms-outline w-100 py-2 btn-sm text-light fw-semibold"
                    onClick={() => handleOpenBooking(MOVIES[0])}
                  >
                    🎟️ Reserve Fan Tickets
                  </button>
                </div>
              </div>

              <div className="col-md-4">
                <div className="cinema-event-card p-4 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-info text-dark fw-bold">CINEMA CONCLAVE</span>
                      <span className="text-secondary small">Special Panel</span>
                    </div>
                    <h4 className="fw-bold text-white mb-2 brand-font">Varanasi IMAX First Look</h4>
                    <p className="text-secondary small mb-3">
                      Exclusive 15-minute behind-the-scenes IMAX 1.43:1 showcase and discussion on S. S. Rajamouli's vision.
                    </p>
                    <div className="small text-light mb-3">
                      📍 <strong>Triveni Deluxe 4K</strong> • RTC Road
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-bms-outline w-100 py-2 btn-sm text-light fw-semibold"
                    onClick={() => handleOpenBooking(MOVIES[1] || MOVIES[0])}
                  >
                    🎟️ Register for Showcase
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Upcoming Movies Section */}
          <section className="container mb-5" id="upcoming">
            <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4 pb-2 border-bottom border-white border-opacity-10">
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span style={{ fontSize: '1.35rem' }} aria-hidden="true">🗓️</span>
                  <h2 className="h3 fw-bold text-white mb-0 brand-font">Upcoming Indian Blockbusters</h2>
                  <span
                    className="badge px-2 py-1 small"
                    style={{
                      background: 'rgba(255, 184, 0, 0.16)',
                      color: '#fbbf24',
                      border: '1px solid rgba(255, 184, 0, 0.4)',
                      fontWeight: '700',
                    }}
                  >
                    Coming Soon
                  </span>
                </div>
                <p className="text-secondary small mb-0">
                  Most awaited theatrical releases arriving soon to theatres in {selectedCity.name}
                </p>
              </div>
              <div className="text-secondary small">
                <span className="text-warning fw-bold">{upcomingMovies.length}</span> Releasing Soon
              </div>
            </div>

            <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
              {upcomingMovies.map((movie) => (
                <div key={movie.id} className="col">
                  <MovieCard
                    movie={movie}
                    onBook={handleOpenBooking}
                    onOpenDetails={handleOpenDetails}
                    isInWatchlist={isMovieInWatchlist(movie)}
                    onToggleWatchlist={onToggleWatchlist}
                    watchlistLoading={watchlistActionLoading === (movie._id || movie.id || movie.slug)}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Section 5: Theatres & Cinemas in Anantapur */}
          <section className="container mb-5" id="cinemas">
            <div className="p-4 rounded-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4 pb-3 border-bottom border-secondary border-opacity-25">
                <div>
                  <h3 className="h4 fw-bold text-white mb-1 brand-font">
                    Top Theatres in {selectedCity.name}
                  </h3>
                  <p className="text-secondary small mb-0">
                    Experience movies in crystal-clear 4K projection & Dolby Atmos sound systems
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={onOpenCitySelector}
                >
                  Change City ({selectedCity.name})
                </button>
              </div>

              <div className="row g-3">
                {theatresList.map((th) => {
                  const thId = th.slug || th.id || th._id;
                  const thShowtimes =
                    th.showtimes && th.showtimes.length > 0
                      ? th.showtimes
                      : THEATRES_ANANTAPUR.find((m) => m.id === thId)?.showtimes ||
                        THEATRES_ANANTAPUR[0].showtimes;
                  return (
                    <div key={thId} className="col-md-6">
                      <div className="theatre-card mb-0 h-100">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h5 className="fw-bold text-white mb-1">{th.name}</h5>
                            <p className="text-secondary small mb-0">{th.location}</p>
                          </div>
                          <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-25 small">
                            {th.badge}
                          </span>
                        </div>

                        <div className="d-flex flex-wrap gap-1 my-2">
                          {(th.facilities || []).map((fac, idx) => (
                            <span
                              key={idx}
                              className="badge bg-dark text-muted border border-secondary border-opacity-25"
                              style={{ fontSize: '0.7rem' }}
                            >
                              ✓ {fac}
                            </span>
                          ))}
                        </div>

                        <div className="d-flex flex-wrap gap-2 pt-2 border-top border-secondary border-opacity-10 align-items-center">
                          <span className="small text-secondary">Today's Shows:</span>
                          {thShowtimes.slice(0, 3).map((st, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              className="btn btn-sm btn-outline-secondary text-light py-0 px-2"
                              style={{
                                fontSize: '0.75rem',
                                borderColor: 'rgba(255,255,255,0.1)',
                              }}
                              onClick={() =>
                                handleOpenBooking(moviesList[0] || MOVIES[0])
                              }
                              aria-label={`Book show at ${st.time} in ${th.name}`}
                            >
                              {st.time} ({st.format.split(' ')[0]})
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}

export default HomePage;
