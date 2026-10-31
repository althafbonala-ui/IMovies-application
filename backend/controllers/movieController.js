const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const Showtime = require('../models/Showtime');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const User = require('../models/User');

/**
 * @desc    Get all movies with optional filtering by status, language, genre, or search
 * @route   GET /api/movies
 * @access  Public
 */
const getMovies = async (req, res, next) => {
  try {
    const { status, language, genre, search } = req.query;
    const filter = {};

    // Filter by status ('now_showing' | 'upcoming')
    if (status && (status === 'now_showing' || status === 'upcoming')) {
      filter.status = status;
    }

    // Filter by language (case-insensitive regex match within languages array)
    if (language && language !== 'All') {
      filter.languages = { $regex: new RegExp(`^${language.trim()}$`, 'i') };
    }

    // Filter by genre (case-insensitive regex match within genres array)
    if (genre && genre !== 'All') {
      filter.genres = { $regex: new RegExp(`^${genre.trim()}$`, 'i') };
    }

    // Free text search matching title, director, genres, or cast.name
    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { director: searchRegex },
        { genres: searchRegex },
        { languages: searchRegex },
        { 'cast.name': searchRegex },
      ];
    }

    const movies = await Movie.find(filter).sort({ isHero: -1, rating: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: movies.length,
      data: movies,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single movie by MongoDB ObjectId or unique slug
 * @route   GET /api/movies/:id
 * @access  Public
 */
const getMovieById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid movie identifier',
      });
    }

    let movie;
    if (mongoose.Types.ObjectId.isValid(id)) {
      movie = await Movie.findById(id);
    }

    // If not found by ObjectId, attempt lookup by slug
    if (!movie) {
      movie = await Movie.findOne({ slug: id.toLowerCase().trim() });
    }

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: `Movie not found with identifier '${id}'`,
      });
    }

    return res.status(200).json({
      success: true,
      data: movie,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new movie record with full schema validation
 * @route   POST /api/movies
 * @access  Private (Admin only)
 */
const createMovie = async (req, res, next) => {
  try {
    const {
      title,
      slug,
      tagline,
      status,
      isHero,
      rating,
      voteCount,
      certification,
      languages,
      formats,
      genres,
      duration,
      releaseDate,
      poster,
      banner,
      accentColor,
      director,
      musicDirector,
      cast,
      synopsis,
      criticConsensus,
    } = req.body;

    // 1. Validate required basic fields
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Movie title is required.',
      });
    }

    if (!releaseDate || typeof releaseDate !== 'string' || !releaseDate.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Release date is required.',
      });
    }

    if (!poster || typeof poster !== 'string' || !poster.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Poster image URL or path is required.',
      });
    }

    if (!banner || typeof banner !== 'string' || !banner.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Banner image URL or path is required.',
      });
    }

    // 2. Generate or sanitize slug
    let movieSlug =
      slug && typeof slug === 'string' && slug.trim()
        ? slug.trim().toLowerCase()
        : title
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');

    if (!movieSlug) {
      movieSlug = `movie-${Date.now()}`;
    }

    // Check slug uniqueness
    const existingMovie = await Movie.findOne({ slug: movieSlug });
    if (existingMovie) {
      return res.status(400).json({
        success: false,
        message: `A movie with the slug "${movieSlug}" already exists. Please choose a different title or slug.`,
      });
    }

    // 3. Process array fields (languages, genres, formats)
    let processedLanguages = [];
    if (Array.isArray(languages)) {
      processedLanguages = languages.map((l) => String(l).trim()).filter(Boolean);
    } else if (typeof languages === 'string') {
      processedLanguages = languages.split(',').map((l) => l.trim()).filter(Boolean);
    }

    if (processedLanguages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one language for the movie.',
      });
    }

    let processedGenres = [];
    if (Array.isArray(genres)) {
      processedGenres = genres.map((g) => String(g).trim()).filter(Boolean);
    } else if (typeof genres === 'string') {
      processedGenres = genres.split(',').map((g) => g.trim()).filter(Boolean);
    }

    if (processedGenres.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one genre for the movie.',
      });
    }

    let processedFormats = ['2D'];
    if (Array.isArray(formats) && formats.length > 0) {
      processedFormats = formats.map((f) => String(f).trim()).filter(Boolean);
    } else if (typeof formats === 'string' && formats.trim()) {
      processedFormats = formats.split(',').map((f) => f.trim()).filter(Boolean);
    }

    // 4. Validate enums
    const validStatuses = ['now_showing', 'upcoming'];
    const chosenStatus =
      status && validStatuses.includes(status) ? status : 'now_showing';

    const validCertifications = ['U', 'UA', 'UA 13+', 'UA 16+', 'A', 'S'];
    const chosenCertification =
      certification && validCertifications.includes(certification)
        ? certification
        : 'UA';

    // 5. Parse numerical rating
    let parsedRating = null;
    if (rating !== undefined && rating !== null && rating !== '') {
      const num = Number(rating);
      if (!isNaN(num) && num >= 0 && num <= 10) {
        parsedRating = num;
      }
    }

    // 6. Process cast if provided
    let processedCast = [];
    if (Array.isArray(cast)) {
      processedCast = cast
        .filter((c) => c && typeof c.name === 'string' && c.name.trim())
        .map((c) => ({
          name: c.name.trim(),
          role: c.role ? String(c.role).trim() : '',
          initials: c.initials
            ? String(c.initials).trim()
            : c.name
                .trim()
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase(),
        }));
    }

    // 7. Create movie in database
    const movie = await Movie.create({
      title: title.trim(),
      slug: movieSlug,
      tagline: tagline ? tagline.trim() : '',
      status: chosenStatus,
      isHero: Boolean(isHero),
      rating: parsedRating,
      voteCount: voteCount ? String(voteCount).trim() : '0',
      certification: chosenCertification,
      languages: processedLanguages,
      formats: processedFormats,
      genres: processedGenres,
      duration: duration && duration.trim() ? duration.trim() : 'TBA',
      releaseDate: releaseDate.trim(),
      poster: poster.trim(),
      banner: banner.trim(),
      accentColor: accentColor && accentColor.trim() ? accentColor.trim() : '#f84464',
      director: director ? director.trim() : '',
      musicDirector: musicDirector ? musicDirector.trim() : '',
      cast: processedCast,
      synopsis: synopsis ? synopsis.trim() : '',
      criticConsensus: criticConsensus ? criticConsensus.trim() : '',
    });

    return res.status(201).json({
      success: true,
      message: `Movie "${movie.title}" created successfully!`,
      data: movie,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A movie with this slug or title already exists in the catalog.',
      });
    }
    next(error);
  }
};

/**
 * @desc    Update an existing movie
 * @route   PUT /api/movies/:id
 * @access  Private (Admin only)
 */
const updateMovie = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid movie identifier',
      });
    }

    let movie;
    if (mongoose.Types.ObjectId.isValid(id)) {
      movie = await Movie.findById(id);
    }
    if (!movie) {
      movie = await Movie.findOne({ slug: id.toLowerCase().trim() });
    }

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: `Movie not found with identifier '${id}'`,
      });
    }

    const {
      title,
      slug,
      tagline,
      status,
      isHero,
      rating,
      voteCount,
      certification,
      languages,
      formats,
      genres,
      duration,
      releaseDate,
      poster,
      banner,
      accentColor,
      director,
      musicDirector,
      cast,
      synopsis,
      criticConsensus,
    } = req.body;

    // Validate title if provided
    if (title !== undefined) {
      if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Movie title cannot be empty.',
        });
      }
      movie.title = title.trim();
    }

    // Slug check if explicitly changing
    if (slug !== undefined && typeof slug === 'string' && slug.trim()) {
      const sanitizedSlug = slug.trim().toLowerCase();
      if (sanitizedSlug !== movie.slug) {
        const existing = await Movie.findOne({
          slug: sanitizedSlug,
          _id: { $ne: movie._id },
        });
        if (existing) {
          return res.status(400).json({
            success: false,
            message: `A movie with slug "${sanitizedSlug}" already exists.`,
          });
        }
        movie.slug = sanitizedSlug;
      }
    }

    if (tagline !== undefined) {
      movie.tagline = typeof tagline === 'string' ? tagline.trim() : '';
    }

    if (status !== undefined) {
      const validStatuses = ['now_showing', 'upcoming'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be either "now_showing" or "upcoming".',
        });
      }
      movie.status = status;
    }

    if (isHero !== undefined) {
      movie.isHero = Boolean(isHero);
    }

    if (rating !== undefined) {
      if (rating === null || rating === '') {
        movie.rating = null;
      } else {
        const num = Number(rating);
        if (!isNaN(num) && num >= 0 && num <= 10) {
          movie.rating = num;
        } else {
          return res.status(400).json({
            success: false,
            message: 'Rating must be a number between 0 and 10.',
          });
        }
      }
    }

    if (voteCount !== undefined) {
      movie.voteCount =
        typeof voteCount === 'string' || typeof voteCount === 'number'
          ? String(voteCount).trim()
          : '0';
    }

    if (certification !== undefined) {
      const validCertifications = ['U', 'UA', 'UA 13+', 'UA 16+', 'A', 'S'];
      if (!validCertifications.includes(certification)) {
        return res.status(400).json({
          success: false,
          message: `Certification must be one of: ${validCertifications.join(', ')}`,
        });
      }
      movie.certification = certification;
    }

    if (languages !== undefined) {
      let processedLanguages = [];
      if (Array.isArray(languages)) {
        processedLanguages = languages.map((l) => String(l).trim()).filter(Boolean);
      } else if (typeof languages === 'string') {
        processedLanguages = languages.split(',').map((l) => l.trim()).filter(Boolean);
      }
      if (processedLanguages.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please provide at least one language for the movie.',
        });
      }
      movie.languages = processedLanguages;
    }

    if (genres !== undefined) {
      let processedGenres = [];
      if (Array.isArray(genres)) {
        processedGenres = genres.map((g) => String(g).trim()).filter(Boolean);
      } else if (typeof genres === 'string') {
        processedGenres = genres.split(',').map((g) => g.trim()).filter(Boolean);
      }
      if (processedGenres.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please provide at least one genre for the movie.',
        });
      }
      movie.genres = processedGenres;
    }

    if (formats !== undefined) {
      let processedFormats = [];
      if (Array.isArray(formats)) {
        processedFormats = formats.map((f) => String(f).trim()).filter(Boolean);
      } else if (typeof formats === 'string') {
        processedFormats = formats.split(',').map((f) => f.trim()).filter(Boolean);
      }
      if (processedFormats.length === 0) {
        processedFormats = ['2D'];
      }
      movie.formats = processedFormats;
    }

    if (duration !== undefined) {
      movie.duration = typeof duration === 'string' && duration.trim() ? duration.trim() : 'TBA';
    }

    if (releaseDate !== undefined) {
      if (!releaseDate || typeof releaseDate !== 'string' || !releaseDate.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Release date cannot be empty.',
        });
      }
      movie.releaseDate = releaseDate.trim();
    }

    if (poster !== undefined) {
      if (!poster || typeof poster !== 'string' || !poster.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Poster image URL or path cannot be empty.',
        });
      }
      movie.poster = poster.trim();
    }

    if (banner !== undefined) {
      if (!banner || typeof banner !== 'string' || !banner.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Banner image URL or path cannot be empty.',
        });
      }
      movie.banner = banner.trim();
    }

    if (accentColor !== undefined) {
      movie.accentColor =
        typeof accentColor === 'string' && accentColor.trim() ? accentColor.trim() : '#f84464';
    }

    if (director !== undefined) {
      movie.director = typeof director === 'string' ? director.trim() : '';
    }

    if (musicDirector !== undefined) {
      movie.musicDirector = typeof musicDirector === 'string' ? musicDirector.trim() : '';
    }

    if (cast !== undefined) {
      let processedCast = [];
      if (Array.isArray(cast)) {
        processedCast = cast
          .filter((c) => c && typeof c.name === 'string' && c.name.trim())
          .map((c) => ({
            name: c.name.trim(),
            role: c.role ? String(c.role).trim() : '',
            initials: c.initials
              ? String(c.initials).trim()
              : c.name
                  .trim()
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase(),
          }));
      }
      movie.cast = processedCast;
    }

    if (synopsis !== undefined) {
      movie.synopsis = typeof synopsis === 'string' ? synopsis.trim() : '';
    }

    if (criticConsensus !== undefined) {
      movie.criticConsensus = typeof criticConsensus === 'string' ? criticConsensus.trim() : '';
    }

    await movie.save();

    return res.status(200).json({
      success: true,
      message: `Movie "${movie.title}" updated successfully!`,
      data: movie,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A movie with this slug or title already exists in the catalog.',
      });
    }
    next(error);
  }
};

/**
 * @desc    Delete a movie with integrity safeguards
 * @route   DELETE /api/movies/:id
 * @access  Private (Admin only)
 */
const deleteMovie = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid movie identifier',
      });
    }

    let movie;
    if (mongoose.Types.ObjectId.isValid(id)) {
      movie = await Movie.findById(id);
    }
    if (!movie) {
      movie = await Movie.findOne({ slug: id.toLowerCase().trim() });
    }

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: `Movie not found with identifier '${id}'`,
      });
    }

    // 1. Safeguard: Check for existing showtimes referencing this movie
    const showtimesCount = await Showtime.countDocuments({ movie: movie._id });

    // 2. Safeguard: Check for existing bookings referencing this movie
    const bookingsCount = await Booking.countDocuments({ movie: movie._id });

    if (showtimesCount > 0 || bookingsCount > 0) {
      const reasons = [];
      if (showtimesCount > 0) {
        reasons.push(`${showtimesCount} scheduled showtime${showtimesCount > 1 ? 's' : ''}`);
      }
      if (bookingsCount > 0) {
        reasons.push(`${bookingsCount} existing booking${bookingsCount > 1 ? 's' : ''}`);
      }

      return res.status(400).json({
        success: false,
        message: `Cannot delete movie "${movie.title}" because it has ${reasons.join(' and ')} linked to it. Please cancel or remove the related showtimes and bookings first.`,
        linkedShowtimes: showtimesCount,
        linkedBookings: bookingsCount,
      });
    }

    // 3. Clean up associated reviews and user watchlist references
    await Promise.all([
      Review.deleteMany({ movie: movie._id }),
      User.updateMany({ watchlist: movie._id }, { $pull: { watchlist: movie._id } }),
    ]);

    // 4. Delete the movie document
    await Movie.findByIdAndDelete(movie._id);

    return res.status(200).json({
      success: true,
      message: `Movie "${movie.title}" was successfully deleted from the catalog.`,
      data: { id: movie._id, title: movie.title },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
};
