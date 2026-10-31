const mongoose = require('mongoose');
const User = require('../models/User');
const Movie = require('../models/Movie');

/**
 * Helper to resolve raw movie identifier (ObjectId or slug) to a verified Movie document
 * @param {string} rawId - ObjectId or slug
 * @returns {Promise<object|null>} Movie document or null
 */
const resolveMovie = async (rawId) => {
  if (!rawId || typeof rawId !== 'string') {
    return null;
  }

  const trimmed = rawId.trim();

  // If valid ObjectId, first check by _id
  if (mongoose.Types.ObjectId.isValid(trimmed)) {
    const movieById = await Movie.findById(trimmed);
    if (movieById) return movieById;
  }

  // Otherwise check by slug
  const movieBySlug = await Movie.findOne({ slug: trimmed.toLowerCase() });
  return movieBySlug;
};

/**
 * @desc    Get current authenticated user's watchlist
 * @route   GET /api/watchlist
 * @access  Private (Authenticated users only)
 */
const getWatchlist = async (req, res) => {
  try {
    // Strictly derive user ID from authenticated JWT token
    const user = await User.findById(req.user._id).populate('watchlist');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    // Filter out any stale references if movies were removed from database
    const activeMovies = (user.watchlist || []).filter((item) => item !== null && item !== undefined);

    return res.status(200).json({
      success: true,
      count: activeMovies.length,
      data: activeMovies,
    });
  } catch (error) {
    console.error('[WatchlistController] Error getting watchlist:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving watchlist',
      error: error.message,
    });
  }
};

/**
 * @desc    Add a movie to authenticated user's watchlist
 * @route   POST /api/watchlist/:movieId or POST /api/watchlist (body: { movieId })
 * @access  Private (Authenticated users only)
 */
const addToWatchlist = async (req, res) => {
  try {
    const rawMovieId = req.params.movieId || req.body.movieId;

    if (!rawMovieId || !rawMovieId.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid movie ID or slug',
      });
    }

    // Validate and locate movie
    const movie = await resolveMovie(rawMovieId.toString());

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found. Please verify the movie ID or slug',
      });
    }

    // Check user's current watchlist to prevent duplicate entries
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    const currentWatchlist = user.watchlist || [];
    const isDuplicate = currentWatchlist.some(
      (savedId) => savedId && savedId.toString() === movie._id.toString()
    );

    if (isDuplicate) {
      return res.status(400).json({
        success: false,
        message: `"${movie.title}" is already in your watchlist`,
      });
    }

    // Atomically add movie to user's watchlist
    await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { watchlist: movie._id } },
      { new: true }
    );

    // Fetch updated populated watchlist
    const updatedUser = await User.findById(req.user._id).populate('watchlist');
    const validWatchlist = (updatedUser.watchlist || []).filter((item) => item !== null);

    return res.status(200).json({
      success: true,
      message: `"${movie.title}" added to your watchlist`,
      count: validWatchlist.length,
      data: validWatchlist,
    });
  } catch (error) {
    console.error('[WatchlistController] Error adding to watchlist:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error adding movie to watchlist',
      error: error.message,
    });
  }
};

/**
 * @desc    Remove a movie from authenticated user's watchlist
 * @route   DELETE /api/watchlist/:movieId
 * @access  Private (Authenticated users only)
 */
const removeFromWatchlist = async (req, res) => {
  try {
    const rawMovieId = req.params.movieId || req.body.movieId;

    if (!rawMovieId || !rawMovieId.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid movie ID or slug to remove',
      });
    }

    const movie = await resolveMovie(rawMovieId.toString());

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    // If movie was found in DB, match against its _id.
    // If movie was deleted from DB but rawMovieId is an ObjectId, also match by rawMovieId.
    const targetIdStr = movie ? movie._id.toString() : rawMovieId.toString().trim();

    const existsInList = (user.watchlist || []).some(
      (savedId) => savedId && savedId.toString() === targetIdStr
    );

    if (!existsInList) {
      return res.status(404).json({
        success: false,
        message: 'Movie is not present in your watchlist',
      });
    }

    // Atomically pull target ID from user's watchlist
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { watchlist: movie ? movie._id : targetIdStr } },
      { new: true }
    );

    // Fetch updated populated watchlist
    const updatedUser = await User.findById(req.user._id).populate('watchlist');
    const validWatchlist = (updatedUser.watchlist || []).filter((item) => item !== null);

    return res.status(200).json({
      success: true,
      message: movie ? `"${movie.title}" removed from your watchlist` : 'Movie removed from your watchlist',
      count: validWatchlist.length,
      data: validWatchlist,
    });
  } catch (error) {
    console.error('[WatchlistController] Error removing from watchlist:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error removing movie from watchlist',
      error: error.message,
    });
  }
};

module.exports = {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
};
