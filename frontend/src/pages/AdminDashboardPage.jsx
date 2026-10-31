import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAdminStats } from '../services/adminService';
import { fetchMovies, createMovie, updateMovie, deleteMovie } from '../services/movieService';
import { fetchTheatres, createTheatre, updateTheatre } from '../services/theatreService';
import { fetchShowtimes, createShowtime, updateShowtime } from '../services/showtimeService';
import { getPosterPlaceholder } from '../data/mockMovies';

// Suggested preset image URLs for convenience when adding demo movies
const PRESET_POSTERS = [
  { label: 'Cinematic Camera', url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=700&q=80' },
  { label: 'Auditorium Stage', url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=700&q=80' },
  { label: 'Neon Cinema', url: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=700&q=80' },
  { label: 'Retro Film Reel', url: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=700&q=80' },
];

const PRESET_BANNERS = [
  { label: 'Auditorium Hall', url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1600&q=80' },
  { label: 'Cosmic Nebula', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80' },
  { label: 'Dramatic Flare', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80' },
];

const AVAILABLE_LANGUAGES = ['Telugu', 'Hindi', 'Tamil', 'English', 'Malayalam', 'Kannada'];
const AVAILABLE_GENRES = ['Action', 'Thriller', 'Drama', 'Sci-Fi', 'Romance', 'Comedy', 'Adventure', 'Mythology'];
const AVAILABLE_FORMATS = ['2D', '3D', 'IMAX 3D', '4DX'];
const AVAILABLE_CERTIFICATIONS = ['U', 'UA', 'UA 13+', 'UA 16+', 'A'];

const AVAILABLE_THEATRE_FORMATS = ['2D', '3D', '3D Atmos', '4K Laser', 'IMAX 3D', '4DX', 'EPIQ'];
const AVAILABLE_FACILITIES = [
  'M-Ticket',
  'Food Court',
  'Dolby Atmos',
  'Parking',
  'Wheelchair Accessible',
  'Recliner Seating',
  '4K Laser Projection',
];

const SHOWTIME_PRESETS = [
  '09:30 AM',
  '10:45 AM',
  '01:15 PM',
  '02:30 PM',
  '05:45 PM',
  '06:30 PM',
  '09:15 PM',
  '10:00 PM',
];

/**
 * AdminDashboardPage Component
 *
 * Dedicated administration console for cinema operators and administrators.
 * Displays real-time booking statistics, demo financial metrics, movie catalog management,
 * theatre configuration, and showtime schedule management.
 *
 * Props:
 * - user {object}: Authenticated administrator
 * - showToast {function}: Toast notification dispatcher
 */
function AdminDashboardPage({ user, showToast = () => {} }) {
  const navigate = useNavigate();

  // State: Dashboard metrics & Catalog
  const [stats, setStats] = useState(null);
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab state: 'movies' | 'theatres' | 'shows' | 'bookings'
  const [activeTab, setActiveTab] = useState('movies');

  // Search and filter inside movie catalog
  const [movieSearch, setMovieSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Add / Edit Movie Modal state
  const [addMovieModalOpen, setAddMovieModalOpen] = useState(false);
  const [movieModalMode, setMovieModalMode] = useState('create'); // 'create' | 'edit'
  const [editingMovieId, setEditingMovieId] = useState(null);
  const [deletingMovieId, setDeletingMovieId] = useState(null);
  const [creatingMovie, setCreatingMovie] = useState(false);
  const [formError, setFormError] = useState(null);

  // New Movie Form Fields
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    tagline: '',
    status: 'now_showing',
    certification: 'UA',
    languages: ['Telugu'],
    genres: ['Action'],
    formats: ['2D'],
    duration: '2h 30m',
    releaseDate: 'Dec 2026',
    poster: PRESET_POSTERS[0].url,
    banner: PRESET_BANNERS[0].url,
    director: '',
    synopsis: '',
    isHero: false,
  });

  // Theatre Management State
  const [theatreSearch, setTheatreSearch] = useState('');
  const [theatreCityFilter, setTheatreCityFilter] = useState('all');
  const [theatreModalOpen, setTheatreModalOpen] = useState(false);
  const [theatreModalMode, setTheatreModalMode] = useState('create'); // 'create' | 'edit'
  const [savingTheatre, setSavingTheatre] = useState(false);
  const [theatreFormError, setTheatreFormError] = useState(null);
  const [editingTheatreId, setEditingTheatreId] = useState(null);
  const [theatreFormData, setTheatreFormData] = useState({
    name: '',
    slug: '',
    city: 'Anantapur',
    location: '',
    badge: '4K LASER',
    formats: ['2D', '3D Atmos'],
    facilities: ['M-Ticket', 'Food Court', 'Parking'],
    screens: 1,
  });

  // Showtime Management State
  const [showMovieFilter, setShowMovieFilter] = useState('all');
  const [showTheatreFilter, setShowTheatreFilter] = useState('all');
  const [showDateFilter, setShowDateFilter] = useState('');
  const [showModalOpen, setShowModalOpen] = useState(false);
  const [showModalMode, setShowModalMode] = useState('create'); // 'create' | 'edit'
  const [savingShow, setSavingShow] = useState(false);
  const [showFormError, setShowFormError] = useState(null);
  const [editingShowId, setEditingShowId] = useState(null);
  const [editingShowHasBookings, setEditingShowHasBookings] = useState(false);
  const [editingShowBookedCount, setEditingShowBookedCount] = useState(0);
  const [showFormData, setShowFormData] = useState({
    movie: '',
    theatre: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:45 AM',
    format: 'Telugu 2D',
    price: 180,
    totalSeats: 60,
    status: 'available',
  });

  // Fetch all dashboard data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [statsRes, moviesRes, theatresRes, showtimesRes] = await Promise.all([
        fetchAdminStats(),
        fetchMovies(),
        fetchTheatres(),
        fetchShowtimes(),
      ]);

      if (statsRes && statsRes.success) {
        setStats(statsRes.data);
      }
      if (moviesRes && moviesRes.success && Array.isArray(moviesRes.data)) {
        setMovies(moviesRes.data);
      }
      if (theatresRes && theatresRes.success && Array.isArray(theatresRes.data)) {
        setTheatres(theatresRes.data);
      }
      if (showtimesRes && showtimesRes.success && Array.isArray(showtimesRes.data)) {
        setShowtimes(showtimesRes.data);
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Unable to load administrator dashboard metrics. Please verify connectivity.';
      setError(msg);
      showToast('error', 'Dashboard Error', msg, '⚠️');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle Multi-checkbox toggles for languages, genres, formats
  const handleToggleArrayItem = (field, item) => {
    setFormData((prev) => {
      const current = prev[field] || [];
      if (current.includes(item)) {
        // Prevent empty array
        if (current.length === 1) return prev;
        return { ...prev, [field]: current.filter((x) => x !== item) };
      }
      return { ...prev, [field]: [...current, item] };
    });
  };

  // Open Add Movie Modal
  const handleOpenCreateMovie = () => {
    setFormData({
      title: '',
      slug: '',
      tagline: '',
      status: 'now_showing',
      certification: 'UA',
      languages: ['Telugu'],
      genres: ['Action'],
      formats: ['2D'],
      duration: '2h 30m',
      releaseDate: 'Dec 2026',
      poster: PRESET_POSTERS[0].url,
      banner: PRESET_BANNERS[0].url,
      director: '',
      synopsis: '',
      isHero: false,
    });
    setEditingMovieId(null);
    setMovieModalMode('create');
    setFormError(null);
    setAddMovieModalOpen(true);
  };

  // Open Edit Movie Modal
  const handleOpenEditMovie = (m) => {
    setFormData({
      title: m.title || '',
      slug: m.slug || '',
      tagline: m.tagline || '',
      status: m.status || 'now_showing',
      certification: m.certification || 'UA',
      languages: Array.isArray(m.languages) && m.languages.length > 0 ? m.languages : ['Telugu'],
      genres: Array.isArray(m.genres) && m.genres.length > 0 ? m.genres : ['Action'],
      formats: Array.isArray(m.formats) && m.formats.length > 0 ? m.formats : ['2D'],
      duration: m.duration || '2h 30m',
      releaseDate: m.releaseDate || '',
      poster: m.poster || PRESET_POSTERS[0].url,
      banner: m.banner || PRESET_BANNERS[0].url,
      director: m.director || '',
      synopsis: m.synopsis || '',
      isHero: Boolean(m.isHero),
    });
    setEditingMovieId(m._id || m.id || m.slug);
    setMovieModalMode('edit');
    setFormError(null);
    setAddMovieModalOpen(true);
  };

  // Delete Movie
  const handleDeleteMovie = async (movie) => {
    const movieIdentifier = movie._id || movie.id || movie.slug;
    const confirmMessage = `Are you sure you want to delete "${movie.title}"?\n\nThis action cannot be undone and will only succeed if no active showtimes or bookings exist for this movie.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setDeletingMovieId(movieIdentifier);
    try {
      const res = await deleteMovie(movieIdentifier);
      if (res && res.success) {
        showToast(
          'success',
          'Movie Deleted',
          `"${movie.title}" was successfully deleted from the catalog.`,
          '🗑️'
        );
        loadDashboardData();
      } else {
        showToast(
          'error',
          'Cannot Delete Movie',
          res?.message || 'Failed to delete movie.',
          '⚠️'
        );
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Error deleting movie.';
      showToast('error', 'Cannot Delete Movie', msg, '⚠️');
    } finally {
      setDeletingMovieId(null);
    }
  };

  // Handle Movie Submission (Create or Edit)
  const handleCreateMovieSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim()) {
      setFormError('Please enter a movie title.');
      return;
    }
    if (!formData.releaseDate.trim()) {
      setFormError('Please enter a release date.');
      return;
    }
    if (!formData.poster.trim()) {
      setFormError('Please provide a poster image URL.');
      return;
    }
    if (!formData.banner.trim()) {
      setFormError('Please provide a banner image URL.');
      return;
    }

    setCreatingMovie(true);

    try {
      const payload = {
        ...formData,
        title: formData.title.trim(),
        slug: formData.slug.trim() || undefined,
        tagline: formData.tagline.trim(),
        director: formData.director.trim(),
        synopsis: formData.synopsis.trim(),
      };

      let res;
      if (movieModalMode === 'create') {
        res = await createMovie(payload);
      } else {
        res = await updateMovie(editingMovieId, payload);
      }

      if (res && res.success) {
        showToast(
          'success',
          movieModalMode === 'create' ? 'Movie Created Successfully!' : 'Movie Updated Successfully!',
          `"${res.data?.title || formData.title}" has been ${movieModalMode === 'create' ? 'added to the cinema catalog' : 'updated successfully'}.`,
          '🎬'
        );

        // Reset and close form
        setFormData({
          title: '',
          slug: '',
          tagline: '',
          status: 'now_showing',
          certification: 'UA',
          languages: ['Telugu'],
          genres: ['Action'],
          formats: ['2D'],
          duration: '2h 30m',
          releaseDate: 'Dec 2026',
          poster: PRESET_POSTERS[0].url,
          banner: PRESET_BANNERS[0].url,
          director: '',
          synopsis: '',
          isHero: false,
        });
        setAddMovieModalOpen(false);
        setEditingMovieId(null);

        // Refresh live catalog and stats
        loadDashboardData();
      } else {
        setFormError(res?.message || `Failed to ${movieModalMode === 'create' ? 'create' : 'update'} movie record.`);
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        `Error ${movieModalMode === 'create' ? 'creating' : 'updating'} movie. Please check your inputs.`;
      setFormError(msg);
      showToast('error', movieModalMode === 'create' ? 'Movie Creation Failed' : 'Movie Update Failed', msg, '⚠️');
    } finally {
      setCreatingMovie(false);
    }
  };

  // Filtered movies calculation
  const filteredMovies = useMemo(() => {
    return movies.filter((m) => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (movieSearch.trim()) {
        const query = movieSearch.toLowerCase().trim();
        const titleMatch = m.title?.toLowerCase().includes(query);
        const directorMatch = m.director?.toLowerCase().includes(query);
        const genreMatch = Array.isArray(m.genres) && m.genres.some((g) => g.toLowerCase().includes(query));
        const langMatch = Array.isArray(m.languages) && m.languages.some((l) => l.toLowerCase().includes(query));
        return titleMatch || directorMatch || genreMatch || langMatch;
      }
      return true;
    });
  }, [movies, statusFilter, movieSearch]);

  // Theatre Array Item Toggle
  const handleToggleTheatreArrayItem = (field, item) => {
    setTheatreFormData((prev) => {
      const current = prev[field] || [];
      if (current.includes(item)) {
        if (current.length === 1 && field === 'formats') return prev; // At least one format required
        return { ...prev, [field]: current.filter((x) => x !== item) };
      }
      return { ...prev, [field]: [...current, item] };
    });
  };

  // Open Add Theatre Modal
  const handleOpenCreateTheatre = () => {
    setTheatreFormData({
      name: '',
      slug: '',
      city: 'Anantapur',
      location: '',
      badge: '4K LASER',
      formats: ['2D', '3D Atmos'],
      facilities: ['M-Ticket', 'Food Court', 'Parking'],
      screens: 1,
    });
    setEditingTheatreId(null);
    setTheatreModalMode('create');
    setTheatreFormError(null);
    setTheatreModalOpen(true);
  };

  // Open Edit Theatre Modal
  const handleOpenEditTheatre = (t) => {
    setTheatreFormData({
      name: t.name || '',
      slug: t.slug || '',
      city: t.city || 'Anantapur',
      location: t.location || '',
      badge: t.badge || '',
      formats: Array.isArray(t.formats) && t.formats.length > 0 ? t.formats : ['2D'],
      facilities: Array.isArray(t.facilities) && t.facilities.length > 0 ? t.facilities : ['M-Ticket'],
      screens: t.screens || 1,
    });
    setEditingTheatreId(t._id);
    setTheatreModalMode('edit');
    setTheatreFormError(null);
    setTheatreModalOpen(true);
  };

  // Submit Theatre (Create or Update)
  const handleSaveTheatreSubmit = async (e) => {
    e.preventDefault();
    setTheatreFormError(null);

    if (!theatreFormData.name.trim()) {
      setTheatreFormError('Please enter a cinema / theatre name.');
      return;
    }
    if (!theatreFormData.city.trim()) {
      setTheatreFormError('Please enter a city.');
      return;
    }
    if (!theatreFormData.location.trim()) {
      setTheatreFormError('Please enter a street address / location.');
      return;
    }
    if (Number(theatreFormData.screens) < 1) {
      setTheatreFormError('Screen count must be at least 1.');
      return;
    }

    setSavingTheatre(true);
    try {
      const payload = {
        name: theatreFormData.name.trim(),
        slug: theatreFormData.slug.trim() || undefined,
        city: theatreFormData.city.trim(),
        location: theatreFormData.location.trim(),
        badge: theatreFormData.badge.trim(),
        formats: theatreFormData.formats,
        facilities: theatreFormData.facilities,
        screens: Math.max(1, Math.floor(Number(theatreFormData.screens))),
      };

      let res;
      if (theatreModalMode === 'create') {
        res = await createTheatre(payload);
      } else {
        res = await updateTheatre(editingTheatreId, payload);
      }

      if (res && res.success) {
        showToast(
          'success',
          theatreModalMode === 'create' ? 'Theatre Created' : 'Theatre Updated',
          `"${theatreFormData.name}" has been ${theatreModalMode === 'create' ? 'added to cinema catalog' : 'updated successfully'}.`,
          '✓'
        );
        setTheatreModalOpen(false);
        loadDashboardData();
      } else {
        setTheatreFormError(res?.message || 'Unable to save theatre.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error saving theatre.';
      setTheatreFormError(msg);
    } finally {
      setSavingTheatre(false);
    }
  };

  // Filtered Theatres & Unique Cities
  const filteredTheatres = useMemo(() => {
    return theatres.filter((t) => {
      const query = theatreSearch.toLowerCase().trim();
      const matchesSearch =
        query === '' ||
        (t.name && t.name.toLowerCase().includes(query)) ||
        (t.city && t.city.toLowerCase().includes(query)) ||
        (t.location && t.location.toLowerCase().includes(query));

      const matchesCity =
        theatreCityFilter === 'all' ||
        (t.city && t.city.toLowerCase() === theatreCityFilter.toLowerCase());

      return matchesSearch && matchesCity;
    });
  }, [theatres, theatreSearch, theatreCityFilter]);

  const uniqueTheatreCities = useMemo(() => {
    const set = new Set();
    theatres.forEach((t) => {
      if (t.city) set.add(t.city);
    });
    return Array.from(set);
  }, [theatres]);

  // Open Schedule Show Modal
  const handleOpenCreateShow = () => {
    const today = new Date().toISOString().split('T')[0];
    setShowFormData({
      movie: movies[0]?._id || '',
      theatre: theatres[0]?._id || '',
      date: today,
      time: '10:45 AM',
      format: 'Telugu 2D',
      price: 180,
      totalSeats: 60,
      status: 'available',
    });
    setEditingShowId(null);
    setEditingShowHasBookings(false);
    setEditingShowBookedCount(0);
    setShowModalMode('create');
    setShowFormError(null);
    setShowModalOpen(true);
  };

  // Open Edit Show Modal
  const handleOpenEditShow = (s) => {
    const bookedCount = Array.isArray(s.bookedSeats) ? s.bookedSeats.length : 0;
    setShowFormData({
      movie: s.movie?._id || s.movie || '',
      theatre: s.theatre?._id || s.theatre || '',
      date: s.date || '',
      time: s.time || '',
      format: s.format || 'Telugu 2D',
      price: s.price !== undefined ? s.price : 180,
      totalSeats: s.totalSeats || 60,
      status: s.status || 'available',
    });
    setEditingShowId(s._id);
    setEditingShowHasBookings(bookedCount > 0);
    setEditingShowBookedCount(bookedCount);
    setShowModalMode('edit');
    setShowFormError(null);
    setShowModalOpen(true);
  };

  // Submit Showtime (Create or Update)
  const handleSaveShowSubmit = async (e) => {
    e.preventDefault();
    setShowFormError(null);

    if (!showFormData.movie) {
      setShowFormError('Please select a movie.');
      return;
    }
    if (!showFormData.theatre) {
      setShowFormError('Please select a cinema theatre.');
      return;
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!showFormData.date || !dateRegex.test(showFormData.date.trim())) {
      setShowFormError('Please provide a valid show date in YYYY-MM-DD format.');
      return;
    }
    if (!showFormData.time || !showFormData.time.trim()) {
      setShowFormError('Please provide a show start time.');
      return;
    }
    if (!showFormData.format || !showFormData.format.trim()) {
      setShowFormError('Please provide a screening format.');
      return;
    }
    if (isNaN(Number(showFormData.price)) || Number(showFormData.price) < 0) {
      setShowFormError('Ticket price must be a valid non-negative number.');
      return;
    }
    const seats = Number(showFormData.totalSeats);
    if (isNaN(seats) || seats < 1) {
      setShowFormError('Total seats must be at least 1.');
      return;
    }
    if (editingShowHasBookings && seats < editingShowBookedCount) {
      setShowFormError(`Total seats cannot be reduced below the ${editingShowBookedCount} already booked customer seats.`);
      return;
    }

    setSavingShow(true);
    try {
      const payload = {
        movie: showFormData.movie,
        theatre: showFormData.theatre,
        date: showFormData.date.trim(),
        time: showFormData.time.trim(),
        format: showFormData.format.trim(),
        price: Number(showFormData.price),
        totalSeats: Math.floor(seats),
        status: showFormData.status,
      };

      let res;
      if (showModalMode === 'create') {
        res = await createShowtime(payload);
      } else {
        res = await updateShowtime(editingShowId, payload);
      }

      if (res && res.success) {
        showToast(
          'success',
          showModalMode === 'create' ? 'Showtime Scheduled' : 'Showtime Updated',
          `Showtime on ${payload.date} at ${payload.time} (${payload.format}) has been ${showModalMode === 'create' ? 'scheduled successfully' : 'updated'}.`,
          '✓'
        );
        setShowModalOpen(false);
        loadDashboardData();
      } else {
        setShowFormError(res?.message || 'Unable to save showtime.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error saving showtime.';
      setShowFormError(msg);
    } finally {
      setSavingShow(false);
    }
  };

  // Filtered Showtimes calculation
  const filteredShowtimes = useMemo(() => {
    return showtimes.filter((s) => {
      const movieId = s.movie?._id || s.movie;
      const theatreId = s.theatre?._id || s.theatre;

      const matchesMovie =
        showMovieFilter === 'all' || (movieId && movieId.toString() === showMovieFilter);

      const matchesTheatre =
        showTheatreFilter === 'all' || (theatreId && theatreId.toString() === showTheatreFilter);

      const matchesDate =
        !showDateFilter || s.date === showDateFilter;

      return matchesMovie && matchesTheatre && matchesDate;
    });
  }, [showtimes, showMovieFilter, showTheatreFilter, showDateFilter]);


  return (
    <div className="admin-dashboard-page py-4 py-md-5">
      <div className="container">
        {/* Breadcrumb Navigation */}
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb small mb-0">
            <li className="breadcrumb-item">
              <button
                type="button"
                className="btn btn-link p-0 text-secondary text-decoration-none small border-0 bg-transparent"
                onClick={() => navigate('/')}
              >
                Home
              </button>
            </li>
            <li className="breadcrumb-item active text-danger fw-semibold" aria-current="page">
              Admin Dashboard
            </li>
          </ol>
        </nav>

        {/* Page Hero Header */}
        <div
          className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 p-4 rounded-4 mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(14, 21, 38, 0.95) 0%, rgba(20, 29, 52, 0.85) 100%)',
            border: '1px solid rgba(248, 68, 100, 0.3)',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div>
            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
              <span style={{ fontSize: '1.8rem' }} aria-hidden="true">🛡️</span>
              <h1 className="h3 fw-bold text-white mb-0 brand-font">
                Cinema Administration & Analytics Hub
              </h1>
              <span className="badge bg-danger rounded-pill px-3 py-1 small">
                Admin Console
              </span>
            </div>
            <p className="text-secondary small mb-1" style={{ maxWidth: '640px' }}>
              Manage movie catalog listings, monitor real-time seat reservations, and inspect simulated
              demo transaction metrics.
            </p>
            <div className="text-secondary small">
              Signed in as: <strong className="text-white">{user?.name}</strong> (
              <span className="text-info">{user?.email}</span>)
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              type="button"
              className="btn btn-sm btn-outline-light d-flex align-items-center gap-2 py-2 px-3 rounded-pill"
              onClick={loadDashboardData}
              disabled={loading}
              title="Refresh admin metrics"
            >
              <span className={loading ? 'spinner-border spinner-border-sm' : ''} aria-hidden="true">
                {!loading && '🔄'}
              </span>
              <span>Refresh Metrics</span>
            </button>
            <button
              type="button"
              className="btn btn-sm btn-bms-primary py-2 px-3 rounded-pill d-flex align-items-center gap-2"
              onClick={handleOpenCreateMovie}
              id="admin-add-movie-btn"
            >
              <span>➕</span>
              <span>Add New Movie</span>
            </button>
          </div>
        </div>

        {/* Demo Financial Notice Banner */}
        <div
          className="p-3 rounded-4 mb-4 d-flex align-items-center gap-3 small"
          style={{
            background: 'rgba(234, 179, 8, 0.08)',
            border: '1px solid rgba(234, 179, 8, 0.28)',
            color: '#fef08a',
          }}
        >
          <span style={{ fontSize: '1.3rem' }} aria-hidden="true">⚠️</span>
          <div>
            <strong className="d-block text-white">Simulated Demo Transaction Environment:</strong>
            All financial totals, booking fees, and payments shown in this dashboard are strictly
            fictional simulations for demonstration purposes. No real bank accounts or currency are charged.
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-danger mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading metrics...</span>
            </div>
            <h5 className="text-white fw-bold mb-1 brand-font">Loading Cinema Analytics</h5>
            <p className="text-secondary small">Aggregating live bookings and movie catalog...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div
            className="p-4 rounded-4 mb-4 text-center mx-auto"
            style={{
              maxWidth: '620px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
            }}
          >
            <span style={{ fontSize: '2.5rem' }} aria-hidden="true">⚠️</span>
            <h4 className="h5 fw-bold text-white mt-2 mb-1">Failed to Load Dashboard Data</h4>
            <p className="text-danger small mb-3">{error}</p>
            <button
              type="button"
              className="btn btn-sm btn-outline-light px-3 py-1 rounded-pill"
              onClick={loadDashboardData}
            >
              🔄 Try Again
            </button>
          </div>
        )}

        {/* Loaded Content */}
        {!loading && !error && stats && (
          <>
            {/* 1. KEY ANALYTICS KPI CARDS GRID */}
            <div className="row g-3 mb-4">
              {/* Card 1: Total Bookings */}
              <div className="col-12 col-sm-6 col-lg-3">
                <div
                  className="p-3 p-md-4 rounded-4 h-100"
                  style={{
                    background: 'linear-gradient(145deg, #0e1526 0%, #0a0f1d 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-secondary small fw-semibold text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                      Total Bookings
                    </span>
                    <span style={{ fontSize: '1.4rem' }}>🎟️</span>
                  </div>
                  <div className="h2 fw-bold text-white mb-2 brand-font">
                    {stats.bookings?.total || 0}
                  </div>
                  <div className="d-flex flex-wrap gap-1 small">
                    <span className="badge bg-success bg-opacity-20 text-success border border-success border-opacity-30">
                      ✓ {stats.bookings?.confirmed || 0} Confirmed
                    </span>
                    <span className="badge bg-danger bg-opacity-20 text-danger border border-danger border-opacity-30">
                      ✕ {stats.bookings?.cancelled || 0} Cancelled
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Tickets / Seats Sold */}
              <div className="col-12 col-sm-6 col-lg-3">
                <div
                  className="p-3 p-md-4 rounded-4 h-100"
                  style={{
                    background: 'linear-gradient(145deg, #0e1526 0%, #0a0f1d 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-secondary small fw-semibold text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                      Confirmed Seats Sold
                    </span>
                    <span style={{ fontSize: '1.4rem' }}>💺</span>
                  </div>
                  <div className="h2 fw-bold text-white mb-2 brand-font" style={{ color: '#f84464' }}>
                    {stats.bookings?.ticketsSold || 0}
                  </div>
                  <span className="text-secondary small">
                    Tickets issued across {stats.catalog?.showtimes || 0} showtimes
                  </span>
                </div>
              </div>

              {/* Card 3: Simulated Demo Revenue */}
              <div className="col-12 col-sm-6 col-lg-3">
                <div
                  className="p-3 p-md-4 rounded-4 h-100"
                  style={{
                    background: 'linear-gradient(145deg, #0e1526 0%, #0a0f1d 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-secondary small fw-semibold text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                      Simulated Demo Revenue
                    </span>
                    <span style={{ fontSize: '1.4rem' }}>💳</span>
                  </div>
                  <div className="h2 fw-bold text-success mb-2 brand-font">
                    ₹{stats.financials?.totalDemoRevenue || 0}
                  </div>
                  <span className="badge bg-warning bg-opacity-20 text-warning border border-warning border-opacity-35 small">
                    Demo Paid Funds Only
                  </span>
                </div>
              </div>

              {/* Card 4: Catalog Size */}
              <div className="col-12 col-sm-6 col-lg-3">
                <div
                  className="p-3 p-md-4 rounded-4 h-100"
                  style={{
                    background: 'linear-gradient(145deg, #0e1526 0%, #0a0f1d 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-secondary small fw-semibold text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                      Active Movies
                    </span>
                    <span style={{ fontSize: '1.4rem' }}>🎥</span>
                  </div>
                  <div className="h2 fw-bold text-white mb-2 brand-font">
                    {stats.catalog?.totalMovies || movies.length}
                  </div>
                  <div className="d-flex flex-wrap gap-1 small">
                    <span className="badge bg-info bg-opacity-20 text-info border border-info border-opacity-30">
                      🎬 {stats.catalog?.nowShowing || 0} Now Showing
                    </span>
                    <span className="badge bg-secondary bg-opacity-30 text-light">
                      📅 {stats.catalog?.upcoming || 0} Upcoming
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. NAVIGATION TABS: Movies, Theatres, Shows, Recent Bookings */}
            <div className="d-flex justify-content-between align-items-center border-bottom border-white border-opacity-10 mb-4 pb-2 overflow-x-auto hide-scrollbar">
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className={`btn btn-sm px-3 py-2 rounded-pill fw-semibold text-nowrap ${
                    activeTab === 'movies'
                      ? 'btn-danger text-white'
                      : 'btn-outline-light text-secondary border-0'
                  }`}
                  onClick={() => setActiveTab('movies')}
                >
                  🎬 Movie Catalog ({movies.length})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm px-3 py-2 rounded-pill fw-semibold text-nowrap ${
                    activeTab === 'theatres'
                      ? 'btn-danger text-white'
                      : 'btn-outline-light text-secondary border-0'
                  }`}
                  onClick={() => setActiveTab('theatres')}
                  id="admin-tab-theatres"
                >
                  🏛️ Theatres ({theatres.length})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm px-3 py-2 rounded-pill fw-semibold text-nowrap ${
                    activeTab === 'shows'
                      ? 'btn-danger text-white'
                      : 'btn-outline-light text-secondary border-0'
                  }`}
                  onClick={() => setActiveTab('shows')}
                  id="admin-tab-shows"
                >
                  🕒 Shows & Schedules ({showtimes.length})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm px-3 py-2 rounded-pill fw-semibold text-nowrap ${
                    activeTab === 'bookings'
                      ? 'btn-danger text-white'
                      : 'btn-outline-light text-secondary border-0'
                  }`}
                  onClick={() => setActiveTab('bookings')}
                >
                  🎟️ Recent Bookings ({stats.recentBookings?.length || 0})
                </button>
              </div>
            </div>

            {/* 3A. TAB 1: MOVIE MANAGEMENT & LIST */}
            {activeTab === 'movies' && (
              <div>
                {/* Search & Filter Toolbar */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      className={`filter-pill ${statusFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('all')}
                    >
                      All ({movies.length})
                    </button>
                    <button
                      type="button"
                      className={`filter-pill ${statusFilter === 'now_showing' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('now_showing')}
                    >
                      Now Showing ({movies.filter((m) => m.status === 'now_showing').length})
                    </button>
                    <button
                      type="button"
                      className={`filter-pill ${statusFilter === 'upcoming' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('upcoming')}
                    >
                      Upcoming ({movies.filter((m) => m.status === 'upcoming').length})
                    </button>
                  </div>

                  <div className="search-container" style={{ maxWidth: '300px', minWidth: '220px' }}>
                    <svg
                      className="search-icon"
                      width="16"
                      height="16"
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
                      className="search-input py-1"
                      placeholder="Search title, genre, language..."
                      value={movieSearch}
                      onChange={(e) => setMovieSearch(e.target.value)}
                      style={{ fontSize: '0.85rem' }}
                      aria-label="Search movies in catalog"
                    />
                    {movieSearch && (
                      <button
                        type="button"
                        className="btn btn-sm text-secondary position-absolute end-0 top-50 translate-middle-y me-2 p-0 border-0"
                        onClick={() => setMovieSearch('')}
                        style={{ fontSize: '0.85rem' }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Movies Table / Cards */}
                {filteredMovies.length === 0 ? (
                  <div
                    className="text-center p-5 rounded-4 my-4"
                    style={{ background: 'rgba(14, 21, 38, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
                  >
                    <span style={{ fontSize: '2rem' }}>🔍</span>
                    <h5 className="text-white fw-bold mt-2 mb-1">No Movies Matched</h5>
                    <p className="text-secondary small mb-3">
                      No movies found matching "{movieSearch}".
                    </p>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-light px-3 rounded-pill"
                      onClick={() => {
                        setMovieSearch('');
                        setStatusFilter('all');
                      }}
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div
                    className="rounded-4 overflow-hidden"
                    style={{
                      background: 'linear-gradient(145deg, #0e1526 0%, #0a0f1d 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    <div className="table-responsive">
                      <table className="table table-dark table-hover mb-0 align-middle">
                        <thead>
                          <tr className="border-bottom border-white border-opacity-10 text-secondary small text-uppercase">
                            <th scope="col" className="ps-4 py-3" style={{ fontSize: '0.72rem' }}>Movie Title</th>
                            <th scope="col" className="py-3" style={{ fontSize: '0.72rem' }}>Status</th>
                            <th scope="col" className="py-3" style={{ fontSize: '0.72rem' }}>Certification</th>
                            <th scope="col" className="py-3" style={{ fontSize: '0.72rem' }}>Languages</th>
                            <th scope="col" className="py-3" style={{ fontSize: '0.72rem' }}>Formats</th>
                            <th scope="col" className="py-3" style={{ fontSize: '0.72rem' }}>Release Date</th>
                            <th scope="col" className="py-3 text-center" style={{ fontSize: '0.72rem' }}>Rating</th>
                            <th scope="col" className="pe-4 py-3 text-end" style={{ fontSize: '0.72rem' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredMovies.map((m) => {
                            const fallback = getPosterPlaceholder(m);
                            const posterSrc = m.poster || fallback;

                            return (
                              <tr key={m._id || m.slug} className="border-bottom border-white border-opacity-5">
                                <td className="ps-4 py-3">
                                  <div className="d-flex align-items-center gap-3">
                                    <div
                                      className="rounded-2 overflow-hidden flex-shrink-0"
                                      style={{
                                        width: '42px',
                                        height: '60px',
                                        background: '#12182c',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                      }}
                                    >
                                      <img
                                        src={posterSrc}
                                        alt={m.title}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={(e) => {
                                          e.currentTarget.onerror = null;
                                          e.currentTarget.src = fallback;
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <strong className="text-white d-block small fw-bold">
                                        {m.title}
                                      </strong>
                                      <span className="text-secondary small" style={{ fontSize: '0.74rem' }}>
                                        {m.genres?.slice(0, 2).join(', ') || 'Feature Film'} • {m.duration || 'TBA'}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span
                                    className={`badge px-2 py-1 small text-uppercase ${
                                      m.status === 'now_showing'
                                        ? 'bg-success bg-opacity-20 text-success border border-success border-opacity-35'
                                        : 'bg-info bg-opacity-20 text-info border border-info border-opacity-35'
                                    }`}
                                    style={{ fontSize: '0.68rem' }}
                                  >
                                    {m.status === 'now_showing' ? 'Now Showing' : 'Upcoming'}
                                  </span>
                                </td>
                                <td>
                                  <span className="badge bg-secondary bg-opacity-40 text-light" style={{ fontSize: '0.7rem' }}>
                                    {m.certification || 'UA'}
                                  </span>
                                </td>
                                <td>
                                  <div className="d-flex flex-wrap gap-1">
                                    {m.languages?.slice(0, 3).map((l, i) => (
                                      <span key={i} className="badge bg-dark text-secondary border border-secondary border-opacity-25" style={{ fontSize: '0.68rem' }}>
                                        {l}
                                      </span>
                                    ))}
                                    {m.languages?.length > 3 && (
                                      <span className="badge bg-dark text-secondary" style={{ fontSize: '0.68rem' }}>
                                        +{m.languages.length - 3}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <div className="d-flex flex-wrap gap-1">
                                    {m.formats?.map((f, i) => (
                                      <span key={i} className="badge bg-danger bg-opacity-20 text-danger border border-danger border-opacity-25" style={{ fontSize: '0.68rem' }}>
                                        {f}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="text-secondary small" style={{ fontSize: '0.8rem' }}>
                                  {m.releaseDate || 'TBA'}
                                </td>
                                <td className="py-3 text-center">
                                  {m.rating ? (
                                    <span className="fw-bold text-warning small">
                                      ★ {m.rating}
                                    </span>
                                  ) : (
                                    <span className="text-secondary small">—</span>
                                  )}
                                </td>
                                <td className="pe-4 py-3 text-end">
                                  <div className="d-flex align-items-center justify-content-end gap-1">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-light rounded-pill px-2 py-1"
                                      style={{ fontSize: '0.75rem' }}
                                      onClick={() => handleOpenEditMovie(m)}
                                      title={`Edit ${m.title}`}
                                    >
                                      ✏️ Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger rounded-pill px-2 py-1"
                                      style={{ fontSize: '0.75rem' }}
                                      onClick={() => handleDeleteMovie(m)}
                                      disabled={deletingMovieId === (m._id || m.id || m.slug)}
                                      title={`Delete ${m.title}`}
                                    >
                                      {deletingMovieId === (m._id || m.id || m.slug) ? (
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                                      ) : (
                                        '🗑️ Delete'
                                      )}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3B. TAB 2: THEATRE MANAGEMENT */}
            {activeTab === 'theatres' && (
              <div>
                {/* Search & Action Toolbar */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      className={`filter-pill ${theatreCityFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setTheatreCityFilter('all')}
                    >
                      All Cities ({theatres.length})
                    </button>
                    {uniqueTheatreCities.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`filter-pill ${theatreCityFilter === c ? 'active' : ''}`}
                        onClick={() => setTheatreCityFilter(c)}
                      >
                        📍 {c} ({theatres.filter((t) => t.city === c).length})
                      </button>
                    ))}
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <div className="input-group input-group-sm" style={{ maxWidth: '260px' }}>
                      <span className="input-group-text bg-dark border-secondary border-opacity-50 text-secondary">
                        🔍
                      </span>
                      <input
                        type="text"
                        className="form-control bg-dark text-light border-secondary border-opacity-50"
                        placeholder="Search theatres..."
                        value={theatreSearch}
                        onChange={(e) => setTheatreSearch(e.target.value)}
                      />
                      {theatreSearch && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setTheatreSearch('')}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      className="btn btn-sm btn-bms-primary rounded-pill px-3 py-1 d-inline-flex align-items-center gap-2 fw-semibold text-nowrap"
                      onClick={handleOpenCreateTheatre}
                      id="admin-add-theatre-btn"
                    >
                      <span>+</span>
                      <span>Add Theatre</span>
                    </button>
                  </div>
                </div>

                {filteredTheatres.length === 0 ? (
                  <div
                    className="text-center p-5 rounded-4 my-4"
                    style={{ background: 'rgba(14, 21, 38, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
                  >
                    <span style={{ fontSize: '2rem' }}>🏛️</span>
                    <h5 className="text-white fw-bold mt-2 mb-1">No Theatres Found</h5>
                    <p className="text-secondary small mb-3">
                      {theatreSearch || theatreCityFilter !== 'all'
                        ? 'Try adjusting your search query or city filter.'
                        : 'No cinema theatres are registered yet. Click below to add the first theatre.'}
                    </p>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-light rounded-pill px-3"
                      onClick={handleOpenCreateTheatre}
                    >
                      + Add New Theatre
                    </button>
                  </div>
                ) : (
                  <div
                    className="rounded-4 overflow-hidden"
                    style={{
                      background: 'linear-gradient(145deg, #0e1526 0%, #0a0f1d 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    <div className="table-responsive">
                      <table className="table table-dark table-hover mb-0 align-middle">
                        <thead>
                          <tr className="border-bottom border-white border-opacity-10 text-secondary small text-uppercase">
                            <th scope="col" className="ps-4 py-3" style={{ fontSize: '0.72rem' }}>Theatre Name & Badge</th>
                            <th scope="col" className="py-3" style={{ fontSize: '0.72rem' }}>City & Location</th>
                            <th scope="col" className="py-3" style={{ fontSize: '0.72rem' }}>Screens</th>
                            <th scope="col" className="py-3" style={{ fontSize: '0.72rem' }}>Screening Formats</th>
                            <th scope="col" className="py-3" style={{ fontSize: '0.72rem' }}>Facilities</th>
                            <th scope="col" className="py-3" style={{ fontSize: '0.72rem' }}>Active Shows</th>
                            <th scope="col" className="pe-4 py-3 text-end" style={{ fontSize: '0.72rem' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTheatres.map((t) => {
                            const showCount = showtimes.filter((s) => {
                              const tId = s.theatre?._id || s.theatre;
                              return tId && tId.toString() === t._id.toString();
                            }).length;

                            return (
                              <tr key={t._id} className="border-bottom border-white border-opacity-5">
                                <td className="ps-4 py-3">
                                  <div className="d-flex align-items-center gap-2">
                                    <span style={{ fontSize: '1.2rem' }}>🏛️</span>
                                    <div>
                                      <div className="fw-bold text-white small">{t.name}</div>
                                      {t.badge && (
                                        <span className="badge bg-danger bg-opacity-20 text-danger border border-danger border-opacity-30 me-1" style={{ fontSize: '0.65rem' }}>
                                          ⚡ {t.badge}
                                        </span>
                                      )}
                                      <span className="text-secondary font-monospace" style={{ fontSize: '0.68rem' }}>
                                        slug: {t.slug}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3">
                                  <div className="text-white small fw-semibold">📍 {t.city}</div>
                                  <div className="text-secondary small text-truncate" style={{ maxWidth: '220px', fontSize: '0.75rem' }}>
                                    {t.location}
                                  </div>
                                </td>
                                <td className="py-3">
                                  <span className="badge bg-secondary bg-opacity-30 text-light fw-normal" style={{ fontSize: '0.72rem' }}>
                                    {t.screens || 1} Screen{t.screens > 1 ? 's' : ''}
                                  </span>
                                </td>
                                <td className="py-3">
                                  <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '180px' }}>
                                    {Array.isArray(t.formats) && t.formats.map((f) => (
                                      <span key={f} className="badge bg-dark border border-secondary border-opacity-40 text-secondary" style={{ fontSize: '0.65rem' }}>
                                        {f}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-3">
                                  <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '190px' }}>
                                    {Array.isArray(t.facilities) && t.facilities.map((fac) => (
                                      <span key={fac} className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-20" style={{ fontSize: '0.65rem' }}>
                                        ✓ {fac}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-3">
                                  <span className={`badge ${showCount > 0 ? 'bg-success bg-opacity-20 text-success border border-success border-opacity-30' : 'bg-secondary bg-opacity-20 text-secondary'}`} style={{ fontSize: '0.72rem' }}>
                                    {showCount} Show{showCount === 1 ? '' : 's'}
                                  </span>
                                </td>
                                <td className="pe-4 py-3 text-end">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-light rounded-pill px-3 py-1"
                                    style={{ fontSize: '0.75rem' }}
                                    onClick={() => handleOpenEditTheatre(t)}
                                    title={`Edit ${t.name}`}
                                  >
                                    ✏️ Edit
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3C. TAB 3: SHOWTIME SCHEDULE MANAGEMENT */}
            {activeTab === 'shows' && (
              <div>
                {/* Search & Filter Toolbar */}
                <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-3">
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    {/* Movie Filter */}
                    <select
                      className="form-select form-select-sm bg-dark text-light border-secondary border-opacity-50"
                      style={{ width: 'auto', minWidth: '180px' }}
                      value={showMovieFilter}
                      onChange={(e) => setShowMovieFilter(e.target.value)}
                    >
                      <option value="all">🎬 All Movies ({movies.length})</option>
                      {movies.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.title}
                        </option>
                      ))}
                    </select>

                    {/* Theatre Filter */}
                    <select
                      className="form-select form-select-sm bg-dark text-light border-secondary border-opacity-50"
                      style={{ width: 'auto', minWidth: '180px' }}
                      value={showTheatreFilter}
                      onChange={(e) => setShowTheatreFilter(e.target.value)}
                    >
                      <option value="all">🏛️ All Theatres ({theatres.length})</option>
                      {theatres.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name} ({t.city})
                        </option>
                      ))}
                    </select>

                    {/* Date Filter */}
                    <input
                      type="date"
                      className="form-control form-control-sm bg-dark text-light border-secondary border-opacity-50"
                      style={{ width: 'auto' }}
                      value={showDateFilter}
                      onChange={(e) => setShowDateFilter(e.target.value)}
                      title="Filter by show date"
                    />
                    {showDateFilter && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setShowDateFilter('')}
                        title="Clear date filter"
                      >
                        ✕ Clear Date
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn btn-sm btn-bms-primary rounded-pill px-3 py-1 d-inline-flex align-items-center gap-2 fw-semibold text-nowrap"
                    onClick={handleOpenCreateShow}
                    id="admin-add-show-btn"
                  >
                    <span>+</span>
                    <span>Schedule Show</span>
                  </button>
                </div>

                {filteredShowtimes.length === 0 ? (
                  <div
                    className="text-center p-5 rounded-4 my-4"
                    style={{ background: 'rgba(14, 21, 38, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
                  >
                    <span style={{ fontSize: '2rem' }}>🕒</span>
                    <h5 className="text-white fw-bold mt-2 mb-1">No Showtimes Found</h5>
                    <p className="text-secondary small mb-3">
                      {showMovieFilter !== 'all' || showTheatreFilter !== 'all' || showDateFilter
                        ? 'Try relaxing your filters to see more scheduled shows.'
                        : 'No showtimes scheduled in the database yet. Click below to schedule a show.'}
                    </p>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-light rounded-pill px-3"
                      onClick={handleOpenCreateShow}
                    >
                      + Schedule New Show
                    </button>
                  </div>
                ) : (
                  <div
                    className="rounded-4 overflow-hidden"
                    style={{
                      background: 'linear-gradient(145deg, #0e1526 0%, #0a0f1d 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    <div className="table-responsive">
                      <table className="table table-dark table-hover mb-0 align-middle">
                        <thead>
                          <tr className="border-bottom border-white border-opacity-10 text-secondary small text-uppercase">
                            <th scope="col" className="ps-4 py-3" style={{ fontSize: '0.72rem' }}>Movie</th>
                            <th scope="col" className="py-3" style={{ fontSize: '0.72rem' }}>Cinema Theatre</th>
                            <th scope="col" className="py-3" style={{ fontSize: '0.72rem' }}>Date & Time</th>
                            <th scope="col" className="py-3" style={{ fontSize: '0.72rem' }}>Format</th>
                            <th scope="col" className="py-3" style={{ fontSize: '0.72rem' }}>Ticket Price</th>
                            <th scope="col" className="py-3" style={{ fontSize: '0.72rem' }}>Seats & Booking Status</th>
                            <th scope="col" className="pe-4 py-3 text-end" style={{ fontSize: '0.72rem' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredShowtimes.map((s) => {
                            const movieTitle = s.movie?.title || 'Unknown Movie';
                            const moviePoster = s.movie?.poster || s.movie?.posterUrl;
                            const theatreName = s.theatre?.name || 'Unknown Cinema';
                            const theatreCity = s.theatre?.city || '';
                            const bookedCount = Array.isArray(s.bookedSeats) ? s.bookedSeats.length : 0;
                            const total = s.totalSeats || 60;
                            const hasActiveBookings = bookedCount > 0;

                            return (
                              <tr key={s._id} className="border-bottom border-white border-opacity-5">
                                <td className="ps-4 py-3">
                                  <div className="d-flex align-items-center gap-2">
                                    {moviePoster ? (
                                      <img
                                        src={moviePoster}
                                        alt={movieTitle}
                                        className="rounded-2 object-fit-cover"
                                        style={{ width: '38px', height: '52px', border: '1px solid rgba(255,255,255,0.1)' }}
                                      />
                                    ) : (
                                      <div
                                        className="rounded-2 d-flex align-items-center justify-content-center bg-dark text-secondary"
                                        style={{ width: '38px', height: '52px', border: '1px solid rgba(255,255,255,0.1)' }}
                                      >
                                        🎬
                                      </div>
                                    )}
                                    <div>
                                      <div className="fw-bold text-white small">{movieTitle}</div>
                                      <span className="badge-cert me-1">{s.movie?.certification || 'UA'}</span>
                                      <span className="text-secondary small" style={{ fontSize: '0.7rem' }}>
                                        {Array.isArray(s.movie?.languages) ? s.movie.languages.slice(0, 2).join(', ') : ''}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3">
                                  <div className="text-white small fw-semibold">{theatreName}</div>
                                  <div className="text-secondary small" style={{ fontSize: '0.72rem' }}>
                                    📍 {theatreCity}
                                  </div>
                                </td>
                                <td className="py-3">
                                  <div className="text-white small fw-bold font-monospace">
                                    🗓️ {s.date}
                                  </div>
                                  <div className="text-danger small fw-semibold">
                                    🕒 {s.time}
                                  </div>
                                </td>
                                <td className="py-3">
                                  <span className="badge bg-dark border border-secondary border-opacity-40 text-light" style={{ fontSize: '0.72rem' }}>
                                    {s.format}
                                  </span>
                                </td>
                                <td className="py-3">
                                  <span className="fw-bold text-white small font-monospace">
                                    ₹{s.price}
                                  </span>
                                </td>
                                <td className="py-3">
                                  <div className="d-flex align-items-center gap-1 mb-1">
                                    <span className="badge bg-secondary bg-opacity-25 text-light fw-normal" style={{ fontSize: '0.7rem' }}>
                                      {bookedCount} / {total} booked
                                    </span>
                                    {hasActiveBookings && (
                                      <span
                                        className="badge bg-warning bg-opacity-20 text-warning border border-warning border-opacity-30"
                                        style={{ fontSize: '0.65rem' }}
                                        title="Active customer bookings present. Core schedule slot is protected."
                                      >
                                        🔒 Protected
                                      </span>
                                    )}
                                  </div>
                                  <span
                                    className={`badge ${
                                      s.status === 'sold_out'
                                        ? 'bg-danger bg-opacity-25 text-danger border border-danger border-opacity-30'
                                        : s.status === 'almost_full'
                                        ? 'bg-warning bg-opacity-25 text-warning border border-warning border-opacity-30'
                                        : 'bg-success bg-opacity-25 text-success border border-success border-opacity-30'
                                    }`}
                                    style={{ fontSize: '0.65rem' }}
                                  >
                                    {s.status}
                                  </span>
                                </td>
                                <td className="pe-4 py-3 text-end">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-light rounded-pill px-3 py-1"
                                    style={{ fontSize: '0.75rem' }}
                                    onClick={() => handleOpenEditShow(s)}
                                    title={`Edit showtime`}
                                  >
                                    ✏️ Edit
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3D. TAB 4: RECENT BOOKING ACTIVITY */}
            {activeTab === 'bookings' && (
              <div>
                {(!stats.recentBookings || stats.recentBookings.length === 0) ? (
                  <div
                    className="text-center p-5 rounded-4 my-4"
                    style={{ background: 'rgba(14, 21, 38, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
                  >
                    <span style={{ fontSize: '2rem' }}>🎟️</span>
                    <h5 className="text-white fw-bold mt-2 mb-1">No Bookings Recorded Yet</h5>
                    <p className="text-secondary small">
                      Simulated booking transactions will appear here as users reserve seats.
                    </p>
                  </div>
                ) : (
                  <div
                    className="rounded-4 overflow-hidden"
                    style={{
                      background: 'linear-gradient(145deg, #0e1526 0%, #0a0f1d 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    <div className="table-responsive">
                      <table className="table table-dark table-hover mb-0 align-middle">
                        <thead>
                          <tr className="border-bottom border-white border-opacity-10 text-secondary small text-uppercase">
                            <th scope="col" className="ps-4 py-3" style={{ fontSize: '0.72rem' }}>Reference</th>
                            <th scope="col" className="py-3" style={{ fontSize: '0.72rem' }}>Movie & Theatre</th>
                            <th scope="col" className="py-3" style={{ fontSize: '0.72rem' }}>Show Schedule</th>
                            <th scope="col" className="py-3" style={{ fontSize: '0.72rem' }}>Seats</th>
                            <th scope="col" className="py-3" style={{ fontSize: '0.72rem' }}>Status</th>
                            <th scope="col" className="py-3" style={{ fontSize: '0.72rem' }}>Payment</th>
                            <th scope="col" className="pe-4 py-3 text-end" style={{ fontSize: '0.72rem' }}>Demo Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentBookings.map((b) => (
                            <tr key={b._id || b.bookingRef} className="border-bottom border-white border-opacity-5">
                              <td className="ps-4 py-3">
                                <strong className="text-white small fw-bold font-monospace">
                                  {b.bookingRef}
                                </strong>
                              </td>
                              <td>
                                <strong className="text-white small d-block">
                                  {b.movie?.title || 'Unknown Title'}
                                </strong>
                                <span className="text-secondary small" style={{ fontSize: '0.72rem' }}>
                                  🏛️ {b.theatre?.name || 'Cinema Hall'}
                                </span>
                              </td>
                              <td className="small text-secondary" style={{ fontSize: '0.78rem' }}>
                                <span className="text-white d-block">{b.showDate}</span>
                                <span>{b.showTime}</span>
                              </td>
                              <td>
                                <div className="d-flex flex-wrap gap-1">
                                  {b.seats?.map((seat, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-25"
                                      style={{ fontSize: '0.7rem' }}
                                    >
                                      {seat}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td>
                                <span
                                  className={`badge px-2 py-1 small text-uppercase ${
                                    b.status === 'confirmed'
                                      ? 'bg-success bg-opacity-20 text-success border border-success border-opacity-35'
                                      : b.status === 'cancelled'
                                      ? 'bg-danger bg-opacity-20 text-danger border border-danger border-opacity-35'
                                      : 'bg-warning bg-opacity-20 text-warning border border-warning border-opacity-35'
                                  }`}
                                  style={{ fontSize: '0.68rem' }}
                                >
                                  {b.status === 'confirmed'
                                    ? 'Confirmed (Demo)'
                                    : b.status === 'cancelled'
                                    ? 'Cancelled (Demo)'
                                    : 'Pending (Demo)'}
                                </span>
                              </td>
                              <td>
                                <span
                                  className={`badge px-2 py-1 small text-uppercase ${
                                    b.paymentStatus === 'paid'
                                      ? 'bg-success bg-opacity-20 text-success border border-success border-opacity-25'
                                      : b.paymentStatus === 'refunded'
                                      ? 'bg-info bg-opacity-20 text-info border border-info border-opacity-25'
                                      : 'bg-danger bg-opacity-20 text-danger border border-danger border-opacity-25'
                                  }`}
                                  style={{ fontSize: '0.68rem' }}
                                >
                                  💳 {b.paymentStatus === 'paid'
                                    ? 'Paid (Demo)'
                                    : b.paymentStatus === 'refunded'
                                    ? 'Refunded (Demo)'
                                    : 'Failed (Demo)'}
                                </span>
                              </td>
                              <td className="pe-4 text-end">
                                <strong className="text-white small">
                                  ₹{b.totalAmount || 0}
                                </strong>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 4. MODAL: ADD NEW MOVIE */}
      {addMovieModalOpen && (
        <div
          className="modal-backdrop-custom"
          onClick={() => {
            if (!creatingMovie) setAddMovieModalOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-movie-modal-title"
        >
          <div
            className="modal-dialog-custom p-0"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px', overflow: 'hidden' }}
          >
            {/* Modal Header */}
            <div
              className="d-flex justify-content-between align-items-center p-3 px-4 border-bottom border-white border-opacity-10"
              style={{ background: 'var(--bg-surface)' }}
            >
              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: '1.3rem' }}>🎬</span>
                <div>
                  <h5 className="h6 fw-bold text-white mb-0 brand-font" id="add-movie-modal-title">
                    {movieModalMode === 'create'
                      ? 'Add New Movie to Cinema Catalog'
                      : `Edit Movie: ${formData.title || 'Movie'}`}
                  </h5>
                  <span className="text-secondary small" style={{ fontSize: '0.74rem' }}>
                    {movieModalMode === 'create'
                      ? 'Saves to MongoDB `movies` collection with schema validation'
                      : `Update movie fields with schema validation`}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary text-light border-0"
                onClick={() => {
                  if (!creatingMovie) setAddMovieModalOpen(false);
                }}
                disabled={creatingMovie}
                aria-label="Close"
                style={{ fontSize: '1.2rem', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleCreateMovieSubmit}>
              <div
                className="p-3 p-sm-4"
                style={{ background: '#0b1020', maxHeight: '75vh', overflowY: 'auto' }}
              >
                {formError && (
                  <div
                    className="p-3 rounded-3 mb-3 small text-danger"
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                    }}
                  >
                    ⚠️ {formError}
                  </div>
                )}

                {/* Movie Title & Optional Custom Slug */}
                <div className="row g-3 mb-3">
                  <div className="col-12 col-sm-8">
                    <label htmlFor="movie-title-input" className="form-label text-secondary small mb-1">
                      Movie Title <span className="text-danger">*</span>
                    </label>
                    <input
                      id="movie-title-input"
                      type="text"
                      className="form-control form-control-sm text-light border-secondary border-opacity-50"
                      style={{ background: '#131b31' }}
                      placeholder="e.g. Game Changer"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      disabled={creatingMovie}
                    />
                  </div>
                  <div className="col-12 col-sm-4">
                    <label htmlFor="movie-slug-input" className="form-label text-secondary small mb-1">
                      Slug (Optional)
                    </label>
                    <input
                      id="movie-slug-input"
                      type="text"
                      className="form-control form-control-sm text-light border-secondary border-opacity-50"
                      style={{ background: '#131b31' }}
                      placeholder="auto-generated"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      disabled={creatingMovie}
                    />
                  </div>
                </div>

                {/* Tagline */}
                <div className="mb-3">
                  <label htmlFor="movie-tagline-input" className="form-label text-secondary small mb-1">
                    Tagline
                  </label>
                  <input
                    id="movie-tagline-input"
                    type="text"
                    className="form-control form-control-sm text-light border-secondary border-opacity-50"
                    style={{ background: '#131b31' }}
                    placeholder="e.g. The revolution begins in cinemas"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    disabled={creatingMovie}
                  />
                </div>

                {/* Status, Certification, Duration, Release Date */}
                <div className="row g-3 mb-3">
                  <div className="col-6 col-sm-3">
                    <label htmlFor="movie-status-select" className="form-label text-secondary small mb-1">
                      Status
                    </label>
                    <select
                      id="movie-status-select"
                      className="form-select form-select-sm text-light border-secondary border-opacity-50"
                      style={{ background: '#131b31' }}
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      disabled={creatingMovie}
                    >
                      <option value="now_showing">Now Showing</option>
                      <option value="upcoming">Upcoming</option>
                    </select>
                  </div>
                  <div className="col-6 col-sm-3">
                    <label htmlFor="movie-cert-select" className="form-label text-secondary small mb-1">
                      Certification
                    </label>
                    <select
                      id="movie-cert-select"
                      className="form-select form-select-sm text-light border-secondary border-opacity-50"
                      style={{ background: '#131b31' }}
                      value={formData.certification}
                      onChange={(e) => setFormData({ ...formData, certification: e.target.value })}
                      disabled={creatingMovie}
                    >
                      {AVAILABLE_CERTIFICATIONS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6 col-sm-3">
                    <label htmlFor="movie-duration-input" className="form-label text-secondary small mb-1">
                      Duration
                    </label>
                    <input
                      id="movie-duration-input"
                      type="text"
                      className="form-control form-control-sm text-light border-secondary border-opacity-50"
                      style={{ background: '#131b31' }}
                      placeholder="e.g. 2h 45m"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      disabled={creatingMovie}
                    />
                  </div>
                  <div className="col-6 col-sm-3">
                    <label htmlFor="movie-release-input" className="form-label text-secondary small mb-1">
                      Release Date <span className="text-danger">*</span>
                    </label>
                    <input
                      id="movie-release-input"
                      type="text"
                      className="form-control form-control-sm text-light border-secondary border-opacity-50"
                      style={{ background: '#131b31' }}
                      placeholder="e.g. Dec 25, 2026"
                      value={formData.releaseDate}
                      onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                      required
                      disabled={creatingMovie}
                    />
                  </div>
                </div>

                {/* Languages Selection */}
                <div className="mb-3">
                  <span className="form-label text-secondary small d-block mb-1">
                    Languages (Select at least one) <span className="text-danger">*</span>
                  </span>
                  <div className="d-flex flex-wrap gap-2">
                    {AVAILABLE_LANGUAGES.map((lang) => {
                      const selected = formData.languages.includes(lang);
                      return (
                        <button
                          key={lang}
                          type="button"
                          className={`btn btn-sm rounded-pill px-3 py-1 ${
                            selected
                              ? 'btn-danger text-white'
                              : 'btn-outline-secondary text-secondary'
                          }`}
                          style={{ fontSize: '0.78rem' }}
                          onClick={() => handleToggleArrayItem('languages', lang)}
                          disabled={creatingMovie}
                        >
                          {selected ? '✓ ' : '+ '}{lang}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Genres Selection */}
                <div className="mb-3">
                  <span className="form-label text-secondary small d-block mb-1">
                    Genres (Select at least one) <span className="text-danger">*</span>
                  </span>
                  <div className="d-flex flex-wrap gap-2">
                    {AVAILABLE_GENRES.map((genre) => {
                      const selected = formData.genres.includes(genre);
                      return (
                        <button
                          key={genre}
                          type="button"
                          className={`btn btn-sm rounded-pill px-3 py-1 ${
                            selected
                              ? 'btn-danger text-white'
                              : 'btn-outline-secondary text-secondary'
                          }`}
                          style={{ fontSize: '0.78rem' }}
                          onClick={() => handleToggleArrayItem('genres', genre)}
                          disabled={creatingMovie}
                        >
                          {selected ? '✓ ' : '+ '}{genre}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Formats Selection */}
                <div className="mb-3">
                  <span className="form-label text-secondary small d-block mb-1">
                    Screen Formats
                  </span>
                  <div className="d-flex flex-wrap gap-2">
                    {AVAILABLE_FORMATS.map((fmt) => {
                      const selected = formData.formats.includes(fmt);
                      return (
                        <button
                          key={fmt}
                          type="button"
                          className={`btn btn-sm rounded-pill px-3 py-1 ${
                            selected
                              ? 'btn-danger text-white'
                              : 'btn-outline-secondary text-secondary'
                          }`}
                          style={{ fontSize: '0.78rem' }}
                          onClick={() => handleToggleArrayItem('formats', fmt)}
                          disabled={creatingMovie}
                        >
                          {selected ? '✓ ' : '+ '}{fmt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Poster URL & Presets */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label htmlFor="movie-poster-input" className="form-label text-secondary small mb-0">
                      Poster Image URL <span className="text-danger">*</span>
                    </label>
                    <div className="d-flex gap-1">
                      {PRESET_POSTERS.slice(0, 3).map((p, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          className="btn btn-sm p-0 px-2 text-info border-0"
                          style={{ fontSize: '0.7rem', background: 'rgba(56, 189, 248, 0.1)' }}
                          onClick={() => setFormData({ ...formData, poster: p.url })}
                          disabled={creatingMovie}
                        >
                          Fill #{pIdx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    id="movie-poster-input"
                    type="url"
                    className="form-control form-control-sm text-light border-secondary border-opacity-50"
                    style={{ background: '#131b31' }}
                    placeholder="https://..."
                    value={formData.poster}
                    onChange={(e) => setFormData({ ...formData, poster: e.target.value })}
                    required
                    disabled={creatingMovie}
                  />
                </div>

                {/* Banner URL & Presets */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label htmlFor="movie-banner-input" className="form-label text-secondary small mb-0">
                      Banner Image URL <span className="text-danger">*</span>
                    </label>
                    <div className="d-flex gap-1">
                      {PRESET_BANNERS.map((b, bIdx) => (
                        <button
                          key={bIdx}
                          type="button"
                          className="btn btn-sm p-0 px-2 text-info border-0"
                          style={{ fontSize: '0.7rem', background: 'rgba(56, 189, 248, 0.1)' }}
                          onClick={() => setFormData({ ...formData, banner: b.url })}
                          disabled={creatingMovie}
                        >
                          Fill #{bIdx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    id="movie-banner-input"
                    type="url"
                    className="form-control form-control-sm text-light border-secondary border-opacity-50"
                    style={{ background: '#131b31' }}
                    placeholder="https://..."
                    value={formData.banner}
                    onChange={(e) => setFormData({ ...formData, banner: e.target.value })}
                    required
                    disabled={creatingMovie}
                  />
                </div>

                {/* Director & Synopsis */}
                <div className="row g-3 mb-3">
                  <div className="col-12 col-sm-6">
                    <label htmlFor="movie-director-input" className="form-label text-secondary small mb-1">
                      Director
                    </label>
                    <input
                      id="movie-director-input"
                      type="text"
                      className="form-control form-control-sm text-light border-secondary border-opacity-50"
                      style={{ background: '#131b31' }}
                      placeholder="e.g. S. S. Rajamouli"
                      value={formData.director}
                      onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                      disabled={creatingMovie}
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="form-check mt-sm-4 pt-sm-1">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="movie-hero-check"
                        checked={formData.isHero}
                        onChange={(e) => setFormData({ ...formData, isHero: e.target.checked })}
                        disabled={creatingMovie}
                      />
                      <label className="form-check-label text-white small" htmlFor="movie-hero-check">
                        Feature in Hero Carousel Banner
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mb-2">
                  <label htmlFor="movie-synopsis-input" className="form-label text-secondary small mb-1">
                    Synopsis
                  </label>
                  <textarea
                    id="movie-synopsis-input"
                    className="form-control form-control-sm text-light border-secondary border-opacity-50"
                    style={{ background: '#131b31' }}
                    rows="3"
                    placeholder="Brief movie storyline..."
                    value={formData.synopsis}
                    onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                    disabled={creatingMovie}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div
                className="p-3 px-4 d-flex justify-content-end align-items-center gap-2 border-top border-white border-opacity-10"
                style={{ background: 'var(--bg-surface)' }}
              >
                <button
                  type="button"
                  className="btn btn-sm btn-outline-light px-3 rounded-pill"
                  onClick={() => {
                    if (!creatingMovie) setAddMovieModalOpen(false);
                  }}
                  disabled={creatingMovie}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-bms-primary px-4 rounded-pill d-flex align-items-center gap-2"
                  disabled={creatingMovie}
                  id="admin-submit-movie-btn"
                >
                  {creatingMovie ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                      <span>{movieModalMode === 'create' ? 'Creating Movie...' : 'Saving Changes...'}</span>
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>{movieModalMode === 'create' ? 'Create Movie' : 'Save Changes'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: ADD / EDIT THEATRE */}
      {theatreModalOpen && (
        <div
          className="modal-backdrop-custom"
          onClick={() => {
            if (!savingTheatre) setTheatreModalOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="theatre-modal-title"
        >
          <div
            className="modal-dialog-custom p-0"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px' }}
          >
            <form onSubmit={handleSaveTheatreSubmit}>
              {/* Modal Header */}
              <div
                className="p-3 px-4 d-flex justify-content-between align-items-center border-bottom border-white border-opacity-10"
                style={{ background: 'var(--bg-surface)' }}
              >
                <div className="d-flex align-items-center gap-2">
                  <span style={{ fontSize: '1.4rem' }}>🏛️</span>
                  <div>
                    <h5 className="modal-title text-white fw-bold brand-font mb-0" id="theatre-modal-title">
                      {theatreModalMode === 'create' ? 'Add New Cinema Theatre' : 'Edit Cinema Theatre'}
                    </h5>
                    <small className="text-secondary" style={{ fontSize: '0.75rem' }}>
                      {theatreModalMode === 'create'
                        ? 'Register a new screening venue in the iMovies database'
                        : `Updating ${theatreFormData.name || 'theatre venue'}`}
                    </small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary text-light border-0"
                  onClick={() => {
                    if (!savingTheatre) setTheatreModalOpen(false);
                  }}
                  disabled={savingTheatre}
                  style={{ fontSize: '1.25rem', lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                {theatreFormError && (
                  <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
                    <span>⚠️</span>
                    <span>{theatreFormError}</span>
                  </div>
                )}

                {/* Theatre Name & Slug */}
                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-8">
                    <label htmlFor="theatre-name-input" className="form-label text-secondary small mb-1">
                      Cinema Theatre Name <span className="text-danger">*</span>
                    </label>
                    <input
                      id="theatre-name-input"
                      type="text"
                      className="form-control form-control-sm text-light border-secondary border-opacity-50"
                      style={{ background: '#131b31' }}
                      placeholder="e.g. Triveni Deluxe 4K"
                      value={theatreFormData.name}
                      onChange={(e) => setTheatreFormData({ ...theatreFormData, name: e.target.value })}
                      required
                      disabled={savingTheatre}
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <label htmlFor="theatre-slug-input" className="form-label text-secondary small mb-1">
                      Slug <small>(optional)</small>
                    </label>
                    <input
                      id="theatre-slug-input"
                      type="text"
                      className="form-control form-control-sm text-light border-secondary border-opacity-50 font-monospace"
                      style={{ background: '#131b31' }}
                      placeholder="auto-generated"
                      value={theatreFormData.slug}
                      onChange={(e) => setTheatreFormData({ ...theatreFormData, slug: e.target.value })}
                      disabled={savingTheatre}
                    />
                  </div>
                </div>

                {/* City & Street Location */}
                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-5">
                    <label htmlFor="theatre-city-input" className="form-label text-secondary small mb-1">
                      City <span className="text-danger">*</span>
                    </label>
                    <input
                      id="theatre-city-input"
                      type="text"
                      className="form-control form-control-sm text-light border-secondary border-opacity-50"
                      style={{ background: '#131b31' }}
                      placeholder="e.g. Anantapur"
                      value={theatreFormData.city}
                      onChange={(e) => setTheatreFormData({ ...theatreFormData, city: e.target.value })}
                      required
                      disabled={savingTheatre}
                    />
                  </div>
                  <div className="col-12 col-md-7">
                    <label htmlFor="theatre-location-input" className="form-label text-secondary small mb-1">
                      Street Address / Location <span className="text-danger">*</span>
                    </label>
                    <input
                      id="theatre-location-input"
                      type="text"
                      className="form-control form-control-sm text-light border-secondary border-opacity-50"
                      style={{ background: '#131b31' }}
                      placeholder="e.g. Subhash Road, Old Town"
                      value={theatreFormData.location}
                      onChange={(e) => setTheatreFormData({ ...theatreFormData, location: e.target.value })}
                      required
                      disabled={savingTheatre}
                    />
                  </div>
                </div>

                {/* Badge & Screens */}
                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-7">
                    <label htmlFor="theatre-badge-input" className="form-label text-secondary small mb-1">
                      Highlight Badge <small>(promotional tag)</small>
                    </label>
                    <input
                      id="theatre-badge-input"
                      type="text"
                      className="form-control form-control-sm text-light border-secondary border-opacity-50"
                      style={{ background: '#131b31' }}
                      placeholder="e.g. 4K LASER • ATMOS"
                      value={theatreFormData.badge}
                      onChange={(e) => setTheatreFormData({ ...theatreFormData, badge: e.target.value })}
                      disabled={savingTheatre}
                    />
                  </div>
                  <div className="col-12 col-md-5">
                    <label htmlFor="theatre-screens-input" className="form-label text-secondary small mb-1">
                      Number of Screens <span className="text-danger">*</span>
                    </label>
                    <input
                      id="theatre-screens-input"
                      type="number"
                      min="1"
                      className="form-control form-control-sm text-light border-secondary border-opacity-50"
                      style={{ background: '#131b31' }}
                      value={theatreFormData.screens}
                      onChange={(e) => setTheatreFormData({ ...theatreFormData, screens: Number(e.target.value) || 1 })}
                      required
                      disabled={savingTheatre}
                    />
                  </div>
                </div>

                {/* Screening Formats */}
                <div className="mb-3">
                  <label className="form-label text-secondary small mb-1">
                    Available Screening Formats <span className="text-danger">*</span>
                  </label>
                  <div className="d-flex flex-wrap gap-2 pt-1">
                    {AVAILABLE_THEATRE_FORMATS.map((f) => {
                      const isSelected = theatreFormData.formats.includes(f);
                      return (
                        <button
                          key={f}
                          type="button"
                          className={`btn btn-sm rounded-pill px-3 py-1 ${
                            isSelected
                              ? 'btn-danger text-white'
                              : 'btn-outline-secondary text-secondary'
                          }`}
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => handleToggleTheatreArrayItem('formats', f)}
                          disabled={savingTheatre}
                        >
                          {isSelected ? '✓ ' : '+ '} {f}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Facilities */}
                <div className="mb-2">
                  <label className="form-label text-secondary small mb-1">
                    Venue Amenities & Facilities
                  </label>
                  <div className="d-flex flex-wrap gap-2 pt-1">
                    {AVAILABLE_FACILITIES.map((fac) => {
                      const isSelected = theatreFormData.facilities.includes(fac);
                      return (
                        <button
                          key={fac}
                          type="button"
                          className={`btn btn-sm rounded-pill px-3 py-1 ${
                            isSelected
                              ? 'btn-info text-dark fw-semibold'
                              : 'btn-outline-secondary text-secondary'
                          }`}
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => handleToggleTheatreArrayItem('facilities', fac)}
                          disabled={savingTheatre}
                        >
                          {isSelected ? '✓ ' : '+ '} {fac}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div
                className="p-3 px-4 d-flex justify-content-end align-items-center gap-2 border-top border-white border-opacity-10"
                style={{ background: 'var(--bg-surface)' }}
              >
                <button
                  type="button"
                  className="btn btn-sm btn-outline-light px-3 rounded-pill"
                  onClick={() => {
                    if (!savingTheatre) setTheatreModalOpen(false);
                  }}
                  disabled={savingTheatre}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-bms-primary px-4 rounded-pill d-flex align-items-center gap-2"
                  disabled={savingTheatre}
                  id="admin-submit-theatre-btn"
                >
                  {savingTheatre ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                      <span>Saving Theatre...</span>
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>{theatreModalMode === 'create' ? 'Create Theatre' : 'Update Theatre'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: ADD / EDIT SHOWTIME */}
      {showModalOpen && (
        <div
          className="modal-backdrop-custom"
          onClick={() => {
            if (!savingShow) setShowModalOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="show-modal-title"
        >
          <div
            className="modal-dialog-custom p-0"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px' }}
          >
            <form onSubmit={handleSaveShowSubmit}>
              {/* Modal Header */}
              <div
                className="p-3 px-4 d-flex justify-content-between align-items-center border-bottom border-white border-opacity-10"
                style={{ background: 'var(--bg-surface)' }}
              >
                <div className="d-flex align-items-center gap-2">
                  <span style={{ fontSize: '1.4rem' }}>🕒</span>
                  <div>
                    <h5 className="modal-title text-white fw-bold brand-font mb-0" id="show-modal-title">
                      {showModalMode === 'create' ? 'Schedule New Showtime' : 'Edit Showtime Schedule'}
                    </h5>
                    <small className="text-secondary" style={{ fontSize: '0.75rem' }}>
                      {showModalMode === 'create'
                        ? 'Assign a movie slot to a cinema theatre screen'
                        : 'Adjust showtime pricing, format, or availability'}
                    </small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary text-light border-0"
                  onClick={() => {
                    if (!savingShow) setShowModalOpen(false);
                  }}
                  disabled={savingShow}
                  style={{ fontSize: '1.25rem', lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                {showFormError && (
                  <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
                    <span>⚠️</span>
                    <span>{showFormError}</span>
                  </div>
                )}

                {/* Protected Active Bookings Notice */}
                {editingShowHasBookings && (
                  <div
                    className="alert alert-warning py-2 px-3 small rounded-3 mb-3 d-flex align-items-start gap-2"
                    style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)', color: '#fbbf24' }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>🔒</span>
                    <div>
                      <strong>Active Customer Bookings Protected:</strong>
                      <div style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                        This show has {editingShowBookedCount} confirmed booked seat(s). Movie, Theatre, Date, and Start Time are locked to preserve customer booking references and seat reservations. You can safely update ticket price, format, and status.
                      </div>
                    </div>
                  </div>
                )}

                {/* Movie & Theatre Selection */}
                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-6">
                    <label htmlFor="show-movie-select" className="form-label text-secondary small mb-1">
                      Movie <span className="text-danger">*</span>
                    </label>
                    <select
                      id="show-movie-select"
                      className="form-select form-select-sm text-light border-secondary border-opacity-50"
                      style={{ background: '#131b31' }}
                      value={showFormData.movie}
                      onChange={(e) => setShowFormData({ ...showFormData, movie: e.target.value })}
                      required
                      disabled={savingShow || editingShowHasBookings}
                    >
                      <option value="">-- Select Movie --</option>
                      {movies.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.title} ({m.certification || 'UA'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12 col-md-6">
                    <label htmlFor="show-theatre-select" className="form-label text-secondary small mb-1">
                      Cinema Theatre <span className="text-danger">*</span>
                    </label>
                    <select
                      id="show-theatre-select"
                      className="form-select form-select-sm text-light border-secondary border-opacity-50"
                      style={{ background: '#131b31' }}
                      value={showFormData.theatre}
                      onChange={(e) => setShowFormData({ ...showFormData, theatre: e.target.value })}
                      required
                      disabled={savingShow || editingShowHasBookings}
                    >
                      <option value="">-- Select Cinema Theatre --</option>
                      {theatres.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name} ({t.city})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date & Start Time */}
                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-6">
                    <label htmlFor="show-date-input" className="form-label text-secondary small mb-1">
                      Show Date (YYYY-MM-DD) <span className="text-danger">*</span>
                    </label>
                    <input
                      id="show-date-input"
                      type="date"
                      className="form-control form-control-sm text-light border-secondary border-opacity-50"
                      style={{ background: '#131b31' }}
                      value={showFormData.date}
                      onChange={(e) => setShowFormData({ ...showFormData, date: e.target.value })}
                      required
                      disabled={savingShow || editingShowHasBookings}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label htmlFor="show-time-input" className="form-label text-secondary small mb-1">
                      Start Time <span className="text-danger">*</span>
                    </label>
                    <div className="input-group input-group-sm">
                      <input
                        id="show-time-input"
                        type="text"
                        className="form-control text-light border-secondary border-opacity-50"
                        style={{ background: '#131b31' }}
                        placeholder="e.g. 10:45 AM"
                        value={showFormData.time}
                        onChange={(e) => setShowFormData({ ...showFormData, time: e.target.value })}
                        required
                        disabled={savingShow || editingShowHasBookings}
                      />
                      {!editingShowHasBookings && (
                        <select
                          className="form-select text-light border-secondary border-opacity-50"
                          style={{ background: '#131b31', maxWidth: '110px' }}
                          onChange={(e) => {
                            if (e.target.value) {
                              setShowFormData({ ...showFormData, time: e.target.value });
                            }
                          }}
                          value=""
                          disabled={savingShow}
                        >
                          <option value="">Presets</option>
                          {SHOWTIME_PRESETS.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                {/* Format & Ticket Price */}
                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-6">
                    <label htmlFor="show-format-input" className="form-label text-secondary small mb-1">
                      Screening Format <span className="text-danger">*</span>
                    </label>
                    <input
                      id="show-format-input"
                      type="text"
                      className="form-control form-control-sm text-light border-secondary border-opacity-50"
                      style={{ background: '#131b31' }}
                      placeholder="e.g. Telugu 2D or Telugu 3D Atmos"
                      value={showFormData.format}
                      onChange={(e) => setShowFormData({ ...showFormData, format: e.target.value })}
                      required
                      disabled={savingShow}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label htmlFor="show-price-input" className="form-label text-secondary small mb-1">
                      Ticket Price (₹) <span className="text-danger">*</span>
                    </label>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-dark border-secondary border-opacity-50 text-secondary">
                        ₹
                      </span>
                      <input
                        id="show-price-input"
                        type="number"
                        min="0"
                        step="10"
                        className="form-control text-light border-secondary border-opacity-50"
                        style={{ background: '#131b31' }}
                        value={showFormData.price}
                        onChange={(e) => setShowFormData({ ...showFormData, price: Number(e.target.value) || 0 })}
                        required
                        disabled={savingShow}
                      />
                    </div>
                  </div>
                </div>

                {/* Total Seats & Status */}
                <div className="row g-3 mb-2">
                  <div className="col-12 col-md-6">
                    <label htmlFor="show-seats-input" className="form-label text-secondary small mb-1">
                      Total Screen Seats <span className="text-danger">*</span>
                    </label>
                    <input
                      id="show-seats-input"
                      type="number"
                      min={editingShowBookedCount > 0 ? editingShowBookedCount : 1}
                      className="form-control form-control-sm text-light border-secondary border-opacity-50"
                      style={{ background: '#131b31' }}
                      value={showFormData.totalSeats}
                      onChange={(e) => setShowFormData({ ...showFormData, totalSeats: Number(e.target.value) || 60 })}
                      required
                      disabled={savingShow}
                    />
                    {editingShowBookedCount > 0 && (
                      <small className="text-secondary" style={{ fontSize: '0.7rem' }}>
                        Minimum {editingShowBookedCount} seats (already reserved by customers).
                      </small>
                    )}
                  </div>
                  <div className="col-12 col-md-6">
                    <label htmlFor="show-status-select" className="form-label text-secondary small mb-1">
                      Availability Status
                    </label>
                    <select
                      id="show-status-select"
                      className="form-select form-select-sm text-light border-secondary border-opacity-50"
                      style={{ background: '#131b31' }}
                      value={showFormData.status}
                      onChange={(e) => setShowFormData({ ...showFormData, status: e.target.value })}
                      disabled={savingShow}
                    >
                      <option value="available">🟢 Available</option>
                      <option value="filling">🟡 Filling Fast</option>
                      <option value="almost_full">🟠 Almost Full</option>
                      <option value="sold_out">🔴 Sold Out</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div
                className="p-3 px-4 d-flex justify-content-end align-items-center gap-2 border-top border-white border-opacity-10"
                style={{ background: 'var(--bg-surface)' }}
              >
                <button
                  type="button"
                  className="btn btn-sm btn-outline-light px-3 rounded-pill"
                  onClick={() => {
                    if (!savingShow) setShowModalOpen(false);
                  }}
                  disabled={savingShow}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-bms-primary px-4 rounded-pill d-flex align-items-center gap-2"
                  disabled={savingShow}
                  id="admin-submit-show-btn"
                >
                  {savingShow ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                      <span>Saving Showtime...</span>
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>{showModalMode === 'create' ? 'Schedule Show' : 'Update Show'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboardPage;

