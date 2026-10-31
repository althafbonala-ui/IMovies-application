import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Footer Component
 * Complete, cohesive footer matching iMovies cinema design system
 */
function Footer({
  selectedCity,
  onOpenHealthDrawer,
  backendConnected = false,
  user = null,
  onOpenAuthModal = () => {},
  onOpenProfileModal = () => {},
  onLogout = () => {},
}) {
  const navigate = useNavigate();
  return (
    <footer className="mt-5 border-top border-secondary border-opacity-25" style={{ background: '#070a12' }}>
      {/* Top Banner: Regional Partner Cinemas */}
      <div className="py-3 border-bottom border-secondary border-opacity-10" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="container">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: '1.4rem' }} aria-hidden="true">🎬</span>
              <span className="h5 fw-bold m-0 text-white brand-font">
                i<span style={{ color: '#f84464' }}>Movies</span>
              </span>
              <span className="badge bg-secondary bg-opacity-25 text-light ms-1" style={{ fontSize: '0.75rem' }}>
                📍 {selectedCity?.name || 'Anantapur'}
              </span>
            </div>
            <div className="d-flex flex-wrap gap-2 text-secondary small align-items-center">
              <span className="text-secondary" style={{ fontSize: '0.8rem' }}>Partner Cinemas:</span>
              <span className="badge bg-dark border border-secondary border-opacity-25 text-light fw-normal">Sudha Complex 4K</span>
              <span className="badge bg-dark border border-secondary border-opacity-25 text-light fw-normal">SV Multiplex</span>
              <span className="badge bg-dark border border-secondary border-opacity-25 text-light fw-normal">Gowri Cineplex</span>
              <span className="badge bg-dark border border-secondary border-opacity-25 text-light fw-normal">Triveni Deluxe 4K</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="py-5">
        <div className="container">
          <div className="row g-4 justify-content-between">
            {/* Brand Section */}
            <div className="col-12 col-md-4">
              <h6 className="fw-bold text-white mb-3 text-uppercase" style={{ fontSize: '0.82rem', letterSpacing: '0.08em' }}>
                About iMovies
              </h6>
              <p className="small text-secondary mb-3" style={{ lineHeight: '1.65', maxWidth: '340px' }}>
                iMovies is a cinema discovery and ticket-booking platform crafted for movie lovers in Anantapur and Andhra Pradesh. Discover trending blockbusters, explore upcoming releases, and reserve your seats with ease.
              </p>
              <div
                className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill"
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#10b981',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                }}
              >
                <span style={{ fontSize: '0.85rem' }}>✓</span>
                <span>Verified Cinema Partner</span>
              </div>
            </div>

            {/* Navigation */}
            <div className="col-6 col-md-3">
              <h6 className="fw-bold text-white mb-3 text-uppercase" style={{ fontSize: '0.82rem', letterSpacing: '0.08em' }}>
                Quick Navigation
              </h6>
              <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
                <li>
                  <a
                    href="#now-showing"
                    className="text-secondary text-decoration-none hover-light"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('now-showing')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    🎬 Now Showing Movies
                  </a>
                </li>
                <li>
                  <a
                    href="#upcoming"
                    className="text-secondary text-decoration-none hover-light"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('upcoming')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    🗓️ Upcoming Releases
                  </a>
                </li>
                <li>
                  <a
                    href="#cinemas"
                    className="text-secondary text-decoration-none hover-light"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('cinemas')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    🏛️ Cinemas in {selectedCity?.name || 'Anantapur'}
                  </a>
                </li>
              </ul>
            </div>

            {/* Account Section */}
            <div className="col-6 col-md-2">
              <h6 className="fw-bold text-white mb-3 text-uppercase" style={{ fontSize: '0.82rem', letterSpacing: '0.08em' }}>
                Account
              </h6>
              <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
                {!user ? (
                  <>
                    <li>
                      <button
                        type="button"
                        className="btn btn-link p-0 text-secondary text-decoration-none hover-light text-start small border-0 bg-transparent"
                        onClick={onOpenAuthModal}
                      >
                        Sign In
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="btn btn-link p-0 text-danger text-decoration-none hover-light text-start small border-0 bg-transparent fw-semibold"
                        onClick={onOpenAuthModal}
                      >
                        Create Account
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="btn btn-link p-0 text-secondary text-decoration-none hover-light text-start small border-0 bg-transparent"
                        onClick={() => navigate('/watchlist')}
                      >
                        🔖 My Watchlist
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="btn btn-link p-0 text-secondary text-decoration-none hover-light text-start small border-0 bg-transparent"
                        onClick={() => navigate('/my-bookings')}
                      >
                        🎟️ My Bookings
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <span className="text-white fw-bold d-block text-truncate" style={{ maxWidth: '140px' }}>
                        {user.name}
                      </span>
                      <span className="text-secondary small d-block" style={{ fontSize: '0.72rem' }}>
                        {user.role === 'admin' ? '🛡️ Administrator' : '🎬 Member'}
                      </span>
                    </li>
                    <li className="pt-1">
                      <button
                        type="button"
                        className="btn btn-link p-0 text-secondary text-decoration-none hover-light text-start small border-0 bg-transparent"
                        onClick={onOpenProfileModal}
                      >
                        👤 View Profile
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="btn btn-link p-0 text-secondary text-decoration-none hover-light text-start small border-0 bg-transparent"
                        onClick={() => navigate('/watchlist')}
                      >
                        🔖 My Watchlist
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="btn btn-link p-0 text-secondary text-decoration-none hover-light text-start small border-0 bg-transparent"
                        onClick={() => navigate('/my-bookings')}
                      >
                        🎟️ My Bookings
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="btn btn-link p-0 text-danger text-decoration-none hover-light text-start small border-0 bg-transparent fw-semibold"
                        onClick={onLogout}
                      >
                        🚪 Sign Out
                      </button>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Cinema Experience */}
            <div className="col-12 col-md-3">
              <h6 className="fw-bold text-white mb-3 text-uppercase" style={{ fontSize: '0.82rem', letterSpacing: '0.08em' }}>
                Cinema Experience
              </h6>
              <ul className="list-unstyled small d-flex flex-column gap-2 mb-0 text-secondary" style={{ fontSize: '0.82rem', lineHeight: '1.6' }}>
                <li>🎟️ Instant Confirmed M-Tickets</li>
                <li>🔊 4K Laser & Dolby Atmos Screens</li>
                <li>🍿 Concessions & Box Office Pickup</li>
                <li>🛡️ Secure & Verified Theatrical Booking</li>
              </ul>
            </div>
          </div>

          {/* Verified Cinema Booking Assurance */}
          <div className="mt-4 p-3 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <p className="small text-secondary mb-0 text-center" style={{ fontSize: '0.78rem' }}>
              🔒 <strong>100% Verified Theatrical Booking:</strong> Official online ticketing & showtimes across partner screens in Anantapur — Sudha Complex, SV Multiplex, Gowri Cineplex & Triveni Deluxe.
            </p>
          </div>

          {/* Copyright */}
          <div className="text-center text-secondary small mt-4 pt-3 border-top border-secondary border-opacity-10" style={{ fontSize: '0.78rem' }}>
            &copy; {new Date().getFullYear()} iMovies Application • Crafted for Indian Cinema Lovers in Anantapur, Andhra Pradesh
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
