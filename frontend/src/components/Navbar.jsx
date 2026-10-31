import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Navbar({
  searchQuery,
  setSearchQuery,
  selectedCity,
  onOpenCitySelector,
  backendConnected,
  onOpenHealthDrawer,
  activeTab,
  setActiveTab,
  user,
  onOpenAuthModal,
  onOpenProfileModal,
  onLogout,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleNavClick = (tab, targetId) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/#' + (targetId || ''));
      setTimeout(() => {
        if (targetId) {
          const el = document.getElementById(targetId);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    } else if (targetId) {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <>
      <header className="imovies-navbar">
        <div className="container py-2">
          <div className="d-flex align-items-center justify-content-between gap-3">
            {/* Left: Brand Logo & Search */}
            <div className="d-flex align-items-center gap-3 gap-lg-4 flex-grow-1 flex-lg-grow-0">
              {/* Brand Logo */}
              <a
                href="#top"
                className="d-flex align-items-center gap-2 text-decoration-none brand-logo-glow"
                onClick={(e) => {
                  e.preventDefault();
                  if (location.pathname !== '/') {
                    navigate('/');
                  } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                aria-label="iMovies Homepage"
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: '38px',
                    height: '38px',
                    background: 'linear-gradient(135deg, #f84464 0%, #b21032 100%)',
                    boxShadow: '0 0 16px rgba(248, 68, 100, 0.5)',
                  }}
                >
                  <span style={{ fontSize: '1.25rem', lineHeight: 1 }} aria-hidden="true">🎬</span>
                </div>
                <span className="h4 fw-bold m-0 brand-font text-white d-flex align-items-center letter-spacing-tight">
                  i<span style={{ color: '#f84464' }}>Movies</span>
                </span>
              </a>

              {/* Desktop Search Bar */}
              <div className="search-container d-none d-md-block">
                <svg
                  className="search-icon"
                  width="18"
                  height="18"
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
                  className="search-input"
                  placeholder="Search movies, languages, genres, theatres..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search movies, languages, genres and theatres"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="btn btn-sm text-secondary position-absolute end-0 top-50 translate-middle-y me-2 p-0 border-0"
                    onClick={() => setSearchQuery('')}
                    style={{ fontSize: '0.85rem' }}
                    aria-label="Clear search query"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Right: Location, Diagnostics, Auth & Mobile Menu Toggle */}
            <div className="d-flex align-items-center gap-2 gap-sm-3">
              {/* City Location Selector Button */}
              <button
                type="button"
                className="city-selector-btn"
                onClick={onOpenCitySelector}
                title="Change Location"
                aria-label={`Current location: ${selectedCity?.name || 'Anantapur'}. Click to change.`}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f84464"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span className="fw-semibold text-white">{selectedCity?.name || 'Anantapur'}</span>
                <span style={{ fontSize: '0.65rem', opacity: 0.7 }} aria-hidden="true">▼</span>
              </button>


              {/* Authentication Controls: Sign In or User Profile Dropdown */}
              {!user ? (
                <button
                  type="button"
                  className="btn btn-bms-primary btn-sm px-3 py-1 d-inline-flex align-items-center gap-2"
                  onClick={onOpenAuthModal}
                  title="Sign In or Register"
                  aria-label="Sign In or Register"
                >
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: '20px', height: '20px', background: 'rgba(255,255,255,0.2)' }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <span className="d-none d-sm-inline">Sign In</span>
                </button>
              ) : (
                <div className="position-relative">
                  <button
                    type="button"
                    className="btn btn-sm px-2 py-1 d-inline-flex align-items-center gap-2 rounded-pill text-white"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.16)',
                    }}
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    aria-label={`User account menu for ${user.name}`}
                    aria-expanded={userMenuOpen}
                  >
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                      style={{
                        width: '22px',
                        height: '22px',
                        background: 'linear-gradient(135deg, #f84464 0%, #c4183c 100%)',
                        fontSize: '0.68rem',
                      }}
                    >
                      {user.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                    </div>
                    <span
                      className="d-none d-sm-inline small fw-semibold"
                      style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {user.name ? user.name.split(' ')[0] : 'Account'}
                    </span>
                    <span style={{ fontSize: '0.6rem', opacity: 0.7 }} aria-hidden="true">▼</span>
                  </button>

                  {/* Dropdown Menu */}
                  {userMenuOpen && (
                    <div
                      className="position-absolute end-0 mt-2 py-2 rounded-3 shadow-lg"
                      style={{
                        minWidth: '220px',
                        background: '#0e1524',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        zIndex: 1050,
                        backdropFilter: 'blur(14px)',
                      }}
                    >
                      <div className="px-3 py-2 border-bottom border-secondary border-opacity-25">
                        <div className="text-white fw-bold small text-truncate">{user.name}</div>
                        <div className="text-secondary small text-truncate" style={{ fontSize: '0.75rem' }}>{user.email}</div>
                        <div className="mt-1">
                          <span
                            className={`badge ${user.role === 'admin' ? 'bg-warning text-dark' : 'bg-secondary bg-opacity-50 text-white'}`}
                            style={{ fontSize: '0.68rem' }}
                          >
                            {user.role === 'admin' ? '🛡️ Admin' : '🎬 Member'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm text-start w-100 px-3 py-2 text-light d-flex align-items-center gap-2 border-0 bg-transparent"
                        onClick={() => {
                          setUserMenuOpen(false);
                          onOpenProfileModal();
                        }}
                      >
                        <span>👤</span>
                        <span className="small">My Profile & Account</span>
                      </button>
                      {user.role === 'admin' && (
                        <button
                          type="button"
                          className="btn btn-sm text-start w-100 px-3 py-2 text-warning d-flex align-items-center gap-2 border-0 bg-transparent border-bottom border-secondary border-opacity-10"
                          onClick={() => {
                            setUserMenuOpen(false);
                            navigate('/admin');
                          }}
                          id="navbar-admin-dashboard-link"
                        >
                          <span>🛡️</span>
                          <span className="small fw-semibold">Admin Dashboard</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm text-start w-100 px-3 py-2 text-light d-flex align-items-center gap-2 border-0 bg-transparent"
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate('/watchlist');
                        }}
                        id="navbar-watchlist-link"
                      >
                        <span>🔖</span>
                        <span className="small">My Watchlist</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm text-start w-100 px-3 py-2 text-light d-flex align-items-center gap-2 border-0 bg-transparent"
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate('/my-bookings');
                        }}
                      >
                        <span>🎟️</span>
                        <span className="small">My Bookings</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm text-start w-100 px-3 py-2 text-danger d-flex align-items-center gap-2 border-0 bg-transparent border-top border-secondary border-opacity-25"
                        onClick={() => {
                          setUserMenuOpen(false);
                          onLogout();
                        }}
                      >
                        <span>🚪</span>
                        <span className="small fw-semibold">Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Menu Toggle Button */}
              <button
                type="button"
                className="btn btn-outline-secondary d-md-none p-1 px-2 text-light border-secondary border-opacity-25"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>

          {/* Search Bar for Mobile Screens */}
          <div className="d-md-none mt-2 pb-1">
            <div className="search-container w-100">
              <svg
                className="search-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                className="search-input w-100"
                placeholder="Search movies, languages, theatres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search movies on mobile"
              />
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-nav-drawer d-md-none">
            <div className="d-flex flex-column gap-1">
              {/* Mobile Account Section */}
              <div className="pb-2 mb-2 border-bottom border-secondary border-opacity-25">
                {!user ? (
                  <button
                    type="button"
                    className="btn btn-bms-primary btn-sm w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuthModal();
                    }}
                  >
                    <span>Sign In / Create Account</span>
                  </button>
                ) : (
                  <div className="d-flex align-items-center justify-content-between p-2 rounded-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                        style={{
                          width: '28px',
                          height: '28px',
                          background: 'linear-gradient(135deg, #f84464 0%, #c4183c 100%)',
                          fontSize: '0.75rem',
                        }}
                      >
                        {user.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="text-white small fw-bold text-truncate" style={{ maxWidth: '120px' }}>{user.name}</div>
                        <div className="text-secondary small" style={{ fontSize: '0.7rem' }}>{user.role === 'admin' ? '🛡️ Admin' : 'Member'}</div>
                      </div>
                    </div>
                    <div className="d-flex gap-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-light px-2 py-1"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onOpenProfileModal();
                        }}
                      >
                        Profile
                      </button>
                      {user.role === 'admin' && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-warning px-2 py-1"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => {
                            setMobileMenuOpen(false);
                            navigate('/admin');
                          }}
                        >
                          🛡️ Admin
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-light px-2 py-1"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          navigate('/watchlist');
                        }}
                      >
                        Watchlist
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger px-2 py-1"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          navigate('/my-bookings');
                        }}
                      >
                        Bookings
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger px-2 py-1"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onLogout();
                        }}
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                className={`mobile-nav-btn ${activeTab === 'movies' ? 'active' : ''}`}
                onClick={() => handleNavClick('movies', 'now-showing')}
              >
                <span>🎬 Movies In Theatres</span>
                <span className="badge bg-danger text-white">Now Showing</span>
              </button>
              <button
                type="button"
                className={`mobile-nav-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
                onClick={() => handleNavClick('upcoming', 'upcoming')}
              >
                <span>🗓️ Upcoming Releases</span>
                <span className="badge bg-warning text-dark">Coming Soon</span>
              </button>
              <button
                type="button"
                className={`mobile-nav-btn ${activeTab === 'theatres' ? 'active' : ''}`}
                onClick={() => handleNavClick('theatres', 'cinemas')}
              >
                <span>🏛️ Cinemas in {selectedCity?.name || 'Anantapur'}</span>
                <span className="small text-secondary">{selectedCity?.name || 'Anantapur'}</span>
              </button>
              <button
                type="button"
                className={`mobile-nav-btn ${activeTab === 'stream' ? 'active' : ''}`}
                onClick={() => handleNavClick('stream', 'stream')}
              >
                <span>📺 iMovies Stream</span>
                <span className="badge bg-dark border border-secondary text-warning">4K Atmos</span>
              </button>
              <button
                type="button"
                className={`mobile-nav-btn ${activeTab === 'events' ? 'active' : ''}`}
                onClick={() => handleNavClick('events', 'events')}
              >
                <span>🎉 Special Screenings</span>
                <span className="small text-secondary">Events</span>
              </button>
              <button
                type="button"
                className={`mobile-nav-btn ${location.pathname === '/watchlist' ? 'active' : ''}`}
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (!user) {
                    onOpenAuthModal();
                  } else {
                    navigate('/watchlist');
                  }
                }}
              >
                <span>🔖 My Watchlist</span>
                <span className="badge bg-secondary text-white">Saved</span>
              </button>
              <button
                type="button"
                className={`mobile-nav-btn ${location.pathname === '/my-bookings' ? 'active' : ''}`}
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (!user) {
                    onOpenAuthModal();
                  } else {
                    navigate('/my-bookings');
                  }
                }}
              >
                <span>🎟️ My Bookings</span>
                <span className="badge bg-danger text-white">Tickets</span>
              </button>

              <div className="pt-2 mt-2 border-top border-secondary border-opacity-25 d-flex justify-content-between align-items-center">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-light d-flex align-items-center gap-1"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenCitySelector();
                  }}
                >
                  <span>📍 {selectedCity?.name || 'Anantapur'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cinematic Secondary Subnav Bar */}
        <div className="imovies-subnav">
          <div className="container d-flex justify-content-between align-items-center overflow-x-auto py-1">
            <div className="d-flex align-items-center gap-1">
              <button
                type="button"
                onClick={() => handleNavClick('movies', 'now-showing')}
                className={`subnav-link border-0 bg-transparent ${activeTab === 'movies' ? 'active' : ''}`}
              >
                Now Showing
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('upcoming', 'upcoming')}
                className={`subnav-link border-0 bg-transparent ${activeTab === 'upcoming' ? 'active' : ''}`}
              >
                Coming Soon
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('theatres', 'cinemas')}
                className={`subnav-link border-0 bg-transparent ${activeTab === 'theatres' ? 'active' : ''}`}
              >
                Cinemas in {selectedCity?.name || 'Anantapur'}
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('stream', 'stream')}
                className={`subnav-link border-0 bg-transparent ${activeTab === 'stream' ? 'active' : ''}`}
              >
                Stream 4K
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('events', 'events')}
                className={`subnav-link border-0 bg-transparent ${activeTab === 'events' ? 'active' : ''}`}
              >
                Special Events
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    onOpenAuthModal();
                  } else {
                    navigate('/watchlist');
                  }
                }}
                className={`subnav-link border-0 bg-transparent ${location.pathname === '/watchlist' ? 'active' : ''}`}
              >
                🔖 Watchlist
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    onOpenAuthModal();
                  } else {
                    navigate('/my-bookings');
                  }
                }}
                className={`subnav-link border-0 bg-transparent ${location.pathname === '/my-bookings' ? 'active' : ''}`}
              >
                🎟️ My Bookings
              </button>
            </div>

            <div className="d-none d-lg-flex align-items-center gap-2 small text-secondary">
              <span
                className="badge px-2 py-1"
                style={{
                  background: 'rgba(248, 68, 100, 0.18)',
                  color: '#ff4d6f',
                  border: '1px solid rgba(248, 68, 100, 0.4)',
                  fontWeight: '700',
                  letterSpacing: '0.04em',
                }}
              >
                ⚡ LIVE IN ANANTAPUR
              </span>
              <span>• Sudha Complex, SV Multiplex & Gowri Cineplex</span>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export default Navbar;
