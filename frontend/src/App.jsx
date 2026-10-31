import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { checkHealth } from './services/api';
import { getUserProfile, logoutUser } from './services/authService';
import { fetchMovies, fetchTheatres } from './services/movieService';
import { MOVIES, CITIES, THEATRES_ANANTAPUR } from './data/mockMovies';

// Pages
import HomePage from './pages/HomePage';
import MyBookingsPage from './pages/MyBookingsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import WatchlistPage from './pages/WatchlistPage';

// Services
import { getWatchlist, addToWatchlist, removeFromWatchlist } from './services/watchlistService';

// Components
import Navbar from './components/Navbar';
import AdminRoute from './components/AdminRoute';
import MovieDetailsModal from './components/MovieDetailsModal';
import BookingModal from './components/BookingModal';
import CitySelectorModal from './components/CitySelectorModal';
import HealthStatusDrawer from './components/HealthStatusDrawer';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import Footer from './components/Footer';
import ToastNotification from './components/ToastNotification';

function App() {
  const navigate = useNavigate();

  // Toast notification state { type, title, message, icon }
  const [toast, setToast] = useState(null);

  const showToast = useCallback((type, title, message, icon) => {
    setToast({ type, title, message, icon });
  }, []);

  const handleCloseToast = useCallback(() => {
    setToast(null);
  }, []);

  // Backend health status state
  const [backendStatus, setBackendStatus] = useState({
    loading: true,
    connected: false,
    data: null,
    error: null,
  });

  // Dynamic Catalog State (defaults to mock data as safe initial hydration)
  const [moviesList, setMoviesList] = useState(MOVIES);
  const [theatresList, setTheatresList] = useState(THEATRES_ANANTAPUR);
  const [catalogSource, setCatalogSource] = useState('connecting'); // 'live' | 'offline-fallback' | 'connecting'

  // Location state (Default: Anantapur, Andhra Pradesh)
  const [selectedCity, setSelectedCity] = useState(
    CITIES.find((c) => c.id === 'anantapur') || CITIES[0]
  );
  const [cityModalOpen, setCityModalOpen] = useState(false);

  // Health drawer modal state
  const [healthDrawerOpen, setHealthDrawerOpen] = useState(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [activeSubnavTab, setActiveSubnavTab] = useState('movies');

  // Booking and Details modal states
  const [selectedMovieForBooking, setSelectedMovieForBooking] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedMovieForDetails, setSelectedMovieForDetails] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // User Authentication states (JWT in localStorage, User profile in-memory only)
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(() => {
    try {
      return Boolean(localStorage.getItem('imovies_token'));
    } catch {
      return false;
    }
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Watchlist state & per-movie action loading state
  const [watchlist, setWatchlist] = useState([]);
  const [watchlistActionLoading, setWatchlistActionLoading] = useState(null);

  // Fetch watchlist for authenticated user
  const fetchWatchlistData = useCallback(async () => {
    const token = localStorage.getItem('imovies_token');
    if (!token) {
      setWatchlist([]);
      return;
    }
    try {
      const res = await getWatchlist();
      if (res && res.success && Array.isArray(res.data)) {
        setWatchlist(res.data);
      }
    } catch {
      // Ignore silent errors during background watchlist fetch
    }
  }, []);

  // Fetch watchlist when user changes
  useEffect(() => {
    if (user) {
      fetchWatchlistData();
    } else {
      setWatchlist([]);
    }
  }, [user, fetchWatchlistData]);

  // Fast lookup array of movie identifiers currently in user's watchlist
  const watchlistIds = useMemo(() => {
    const ids = [];
    watchlist.forEach((m) => {
      if (!m) return;
      if (m._id) ids.push(m._id.toString());
      if (m.id) ids.push(m.id.toString());
      if (m.slug) ids.push(m.slug.toLowerCase());
    });
    return ids;
  }, [watchlist]);

  // Watchlist toggle handler: handles Add / Remove with instant feedback and toast alerts
  const handleToggleWatchlist = async (movie) => {
    if (!user) {
      setAuthModalOpen(true);
      showToast(
        'info',
        'Sign In Required',
        'Please sign in or create an account to save movies to your personal watchlist.',
        '🔒'
      );
      return;
    }

    if (!movie) return;
    const movieId = movie._id || movie.id || movie.slug;
    if (!movieId) return;

    const mIdStr = movie._id ? movie._id.toString() : '';
    const mSlug = movie.slug ? movie.slug.toLowerCase() : '';
    const mId = movie.id ? movie.id.toString() : '';

    const alreadyIn = watchlist.some((item) => {
      if (!item) return false;
      const iId = item._id ? item._id.toString() : '';
      const iSlug = item.slug ? item.slug.toLowerCase() : '';
      const iNum = item.id ? item.id.toString() : '';
      return (
        (mIdStr && iId === mIdStr) ||
        (mSlug && iSlug === mSlug) ||
        (mId && (iId === mId || iNum === mId))
      );
    });

    setWatchlistActionLoading(movieId);
    try {
      if (alreadyIn) {
        const res = await removeFromWatchlist(movieId);
        if (res && res.success) {
          if (Array.isArray(res.data)) {
            setWatchlist(res.data);
          } else {
            setWatchlist((prev) =>
              prev.filter(
                (item) =>
                  (!mIdStr || (item._id && item._id.toString() !== mIdStr)) &&
                  (!mSlug || item.slug !== mSlug)
              )
            );
          }
          showToast(
            'info',
            'Removed from Watchlist',
            `"${movie.title}" has been removed from your watchlist.`,
            '🗑️'
          );
        }
      } else {
        const res = await addToWatchlist(movieId);
        if (res && res.success) {
          if (Array.isArray(res.data)) {
            setWatchlist(res.data);
          } else {
            setWatchlist((prev) => [...prev, movie]);
          }
          showToast(
            'success',
            'Added to Watchlist!',
            `"${movie.title}" has been added to your personal watchlist.`,
            '🔖'
          );
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update watchlist.';
      showToast('error', 'Watchlist Error', msg, '⚠️');
    } finally {
      setWatchlistActionLoading(null);
    }
  };

  // Restore authenticated session from backend on mount if JWT token exists
  useEffect(() => {
    const token = localStorage.getItem('imovies_token');
    if (token) {
      getUserProfile()
        .then((res) => {
          if (res && res.success && res.data) {
            setUser(res.data);
          }
        })
        .catch(() => {
          // Token is invalid or expired
          try {
            localStorage.removeItem('imovies_token');
          } catch {}
          setUser(null);
        })
        .finally(() => {
          setAuthLoading(false);
        });
    } else {
      setAuthLoading(false);
    }

    // Interceptor notification handler: resets in-memory user when 401 is intercepted
    const handleAuthExpired = () => {
      setUser(null);
      setProfileModalOpen(false);
      setWatchlist([]);
    };

    window.addEventListener('imovies:auth-expired', handleAuthExpired);
    return () => {
      window.removeEventListener('imovies:auth-expired', handleAuthExpired);
    };
  }, []);

  // Logout handler
  const handleLogout = async () => {
    const displayName = user?.name ? user.name.split(' ')[0] : 'User';
    try {
      await logoutUser();
    } catch {
      // Ignore network errors during logout
    } finally {
      try {
        localStorage.removeItem('imovies_token');
      } catch {}
      setUser(null);
      setWatchlist([]);
      setWatchlistActionLoading(null);
      setProfileModalOpen(false);
      showToast(
        'info',
        'Signed Out Successfully',
        `Goodbye, ${displayName}! You have been signed out of your account.`,
        '👋'
      );
    }
  };

  // Probe Express backend health check on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        const data = await checkHealth();
        setBackendStatus({
          loading: false,
          connected: true,
          data,
          error: null,
        });
      } catch (err) {
        setBackendStatus({
          loading: false,
          connected: false,
          data: err.response?.data || null,
          error:
            err.response?.data?.message ||
            err.message ||
            'Unable to connect to backend server',
        });
      }
    };

    testConnection();
  }, []);

  // Fetch Live Movies and Theatres from backend with graceful fallback
  useEffect(() => {
    let isMounted = true;

    const loadCatalog = async () => {
      try {
        const [moviesRes, theatresRes] = await Promise.all([
          fetchMovies(),
          fetchTheatres(selectedCity.name),
        ]);

        if (isMounted) {
          if (
            moviesRes &&
            moviesRes.success &&
            Array.isArray(moviesRes.data) &&
            moviesRes.data.length > 0
          ) {
            const normalizedMovies = moviesRes.data.map((m) => ({
              ...m,
              id: m.slug || m._id || m.id,
              posterUrl: m.poster || m.posterUrl,
              bannerUrl: m.banner || m.bannerUrl,
            }));
            setMoviesList(normalizedMovies);
            setCatalogSource('live');
          } else {
            setMoviesList(MOVIES);
            setCatalogSource('offline-fallback');
          }

          if (
            theatresRes &&
            theatresRes.success &&
            Array.isArray(theatresRes.data) &&
            theatresRes.data.length > 0
          ) {
            setTheatresList(theatresRes.data);
          } else {
            setTheatresList(THEATRES_ANANTAPUR);
          }
        }
      } catch {
        if (isMounted) {
          setMoviesList(MOVIES);
          setTheatresList(THEATRES_ANANTAPUR);
          setCatalogSource('offline-fallback');
        }
      }
    };

    loadCatalog();

    return () => {
      isMounted = false;
    };
  }, [selectedCity.name]);

  // Handler to open booking for a specific movie
  const handleOpenBooking = (movie) => {
    setSelectedMovieForBooking(movie);
    setBookingModalOpen(true);
  };

  // Handler to open details modal
  const handleOpenDetails = (movie) => {
    setSelectedMovieForDetails(movie);
    setDetailsModalOpen(true);
  };

  // Filter movies based on search query, language, and genre
  const filteredMovies = useMemo(() => {
    return moviesList.filter((movie) => {
      // Search matching
      const matchesSearch =
        searchQuery.trim() === '' ||
        movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (movie.languages &&
          movie.languages.some((lang) =>
            lang.toLowerCase().includes(searchQuery.toLowerCase())
          )) ||
        (movie.genres &&
          movie.genres.some((g) =>
            g.toLowerCase().includes(searchQuery.toLowerCase())
          ));

      // Language filter
      const matchesLanguage =
        selectedLanguage === 'All' ||
        (movie.languages && movie.languages.includes(selectedLanguage));

      // Genre filter
      const matchesGenre =
        selectedGenre === 'All' ||
        (movie.genres && movie.genres.includes(selectedGenre));

      return matchesSearch && matchesLanguage && matchesGenre;
    });
  }, [moviesList, searchQuery, selectedLanguage, selectedGenre]);

  const nowShowingMovies = filteredMovies.filter((m) => m.status === 'now_showing');
  const upcomingMovies = filteredMovies.filter((m) => m.status === 'upcoming');

  const languagesList = ['All', 'Telugu', 'Hindi', 'English', 'Tamil', 'Malayalam'];
  const genresList = ['All', 'Action', 'Sci-Fi', 'Adventure', 'Fantasy', 'Mythology', 'Drama', 'Thriller', 'Comedy'];

  return (
    <div className="d-flex flex-column min-vh-100" id="top">
      {/* Top Navbar */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCity={selectedCity}
        onOpenCitySelector={() => setCityModalOpen(true)}
        backendConnected={backendStatus.connected}
        onOpenHealthDrawer={() => setHealthDrawerOpen(true)}
        activeTab={activeSubnavTab}
        setActiveTab={setActiveSubnavTab}
        user={user}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onOpenProfileModal={() => setProfileModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-grow-1">
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                catalogSource={catalogSource}
                moviesList={moviesList}
                theatresList={theatresList}
                selectedCity={selectedCity}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedLanguage={selectedLanguage}
                setSelectedLanguage={setSelectedLanguage}
                selectedGenre={selectedGenre}
                setSelectedGenre={setSelectedGenre}
                filteredMovies={filteredMovies}
                nowShowingMovies={nowShowingMovies}
                upcomingMovies={upcomingMovies}
                languagesList={languagesList}
                genresList={genresList}
                handleOpenBooking={handleOpenBooking}
                handleOpenDetails={handleOpenDetails}
                onOpenCitySelector={() => setCityModalOpen(true)}
                watchlistIds={watchlistIds}
                onToggleWatchlist={handleToggleWatchlist}
                watchlistActionLoading={watchlistActionLoading}
              />
            }
          />
          <Route
            path="/watchlist"
            element={
              <WatchlistPage
                user={user}
                authLoading={authLoading}
                onOpenAuthModal={() => setAuthModalOpen(true)}
                showToast={showToast}
                onBookMovie={handleOpenBooking}
                onOpenDetails={handleOpenDetails}
                onWatchlistChanged={fetchWatchlistData}
              />
            }
          />
          <Route path="/my-watchlist" element={<Navigate to="/watchlist" replace />} />
          <Route
            path="/my-bookings"
            element={
              <MyBookingsPage
                user={user}
                authLoading={authLoading}
                onOpenAuthModal={() => setAuthModalOpen(true)}
                showToast={showToast}
                selectedCity={selectedCity}
              />
            }
          />
          <Route path="/bookings" element={<Navigate to="/my-bookings" replace />} />
          <Route
            path="/bookings/:id"
            element={
              <MyBookingsPage
                user={user}
                authLoading={authLoading}
                onOpenAuthModal={() => setAuthModalOpen(true)}
                showToast={showToast}
                selectedCity={selectedCity}
              />
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute
                user={user}
                authLoading={authLoading}
                onOpenAuthModal={() => setAuthModalOpen(true)}
              >
                <AdminDashboardPage
                  user={user}
                  showToast={showToast}
                />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Modals */}
      <CitySelectorModal
        isOpen={cityModalOpen}
        onClose={() => setCityModalOpen(false)}
        selectedCity={selectedCity}
        onSelectCity={(city) => setSelectedCity(city)}
      />

      <MovieDetailsModal
        movie={selectedMovieForDetails}
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        onBookMovie={handleOpenBooking}
        isInWatchlist={
          selectedMovieForDetails
            ? watchlistIds.includes(selectedMovieForDetails._id ? selectedMovieForDetails._id.toString() : '') ||
              watchlistIds.includes(selectedMovieForDetails.id ? selectedMovieForDetails.id.toString() : '') ||
              watchlistIds.includes(selectedMovieForDetails.slug ? selectedMovieForDetails.slug.toLowerCase() : '')
            : false
        }
        onToggleWatchlist={handleToggleWatchlist}
        watchlistLoading={
          selectedMovieForDetails &&
          watchlistActionLoading === (selectedMovieForDetails._id || selectedMovieForDetails.id || selectedMovieForDetails.slug)
        }
        user={user}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        showToast={showToast}
      />

      <BookingModal
        movie={selectedMovieForBooking}
        selectedCity={selectedCity}
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        theatres={theatresList}
        user={user}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        showToast={showToast}
        onNavigateToBookings={() => navigate('/my-bookings')}
      />

      <HealthStatusDrawer
        backendStatus={backendStatus}
        setBackendStatus={setBackendStatus}
        isOpen={healthDrawerOpen}
        onClose={() => setHealthDrawerOpen(false)}
        onOpen={() => setHealthDrawerOpen(true)}
      />

      {/* Phase 2: Authentication & Profile Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(userData, authMode) => {
          setUser(userData);
          if (authMode === 'register') {
            showToast(
              'success',
              'Account Created Successfully!',
              `Welcome to iMovies, ${userData.name || 'Movie Lover'}! Your cinema account is ready.`,
              '✨'
            );
          } else {
            showToast(
              'success',
              'Login Successful!',
              `Welcome back, ${userData.name || 'Movie Lover'}! Enjoy booking your favorite shows.`,
              '🎉'
            );
          }
        }}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={user}
        onProfileUpdated={(updatedUser) => {
          setUser(updatedUser);
          showToast(
            'success',
            'Profile Updated Successfully',
            'Your account details have been saved.',
            '✓'
          );
        }}
        onLogout={handleLogout}
      />

      {/* Footer */}
      <Footer
        selectedCity={selectedCity}
        onOpenHealthDrawer={() => setHealthDrawerOpen(true)}
        backendConnected={backendStatus.connected}
        user={user}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onOpenProfileModal={() => setProfileModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Cinematic Toast Notification Popup */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default App;
