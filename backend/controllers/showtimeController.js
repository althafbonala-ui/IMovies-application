const mongoose = require('mongoose');
const Showtime = require('../models/Showtime');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');

/**
 * @desc    Get showtimes with optional filters (movieId, theatreId, city, date)
 * @route   GET /api/shows
 * @access  Public
 */
const getShowtimes = async (req, res, next) => {
  try {
    const { movieId, theatreId, city, date } = req.query;
    const filter = {};

    // Filter by Movie (supports ObjectId or slug)
    if (movieId && typeof movieId === 'string' && movieId.trim() !== '') {
      const cleanMovieId = movieId.trim();
      if (mongoose.Types.ObjectId.isValid(cleanMovieId)) {
        filter.movie = cleanMovieId;
      } else {
        const foundMovie = await Movie.findOne({ slug: cleanMovieId.toLowerCase() });
        if (foundMovie) {
          filter.movie = foundMovie._id;
        } else {
          // If movie slug doesn't exist, return empty array immediately
          return res.status(200).json({ success: true, count: 0, data: [] });
        }
      }
    }

    // Filter by Theatre (supports ObjectId or slug)
    if (theatreId && typeof theatreId === 'string' && theatreId.trim() !== '') {
      const cleanTheatreId = theatreId.trim();
      if (mongoose.Types.ObjectId.isValid(cleanTheatreId)) {
        filter.theatre = cleanTheatreId;
      } else {
        const foundTheatre = await Theatre.findOne({ slug: cleanTheatreId.toLowerCase() });
        if (foundTheatre) {
          filter.theatre = foundTheatre._id;
        } else {
          return res.status(200).json({ success: true, count: 0, data: [] });
        }
      }
    } else if (city && typeof city === 'string' && city.trim() !== '') {
      // If city is specified, find theatres in that city
      const theatresInCity = await Theatre.find({
        city: { $regex: new RegExp(`^${city.trim()}$`, 'i') },
      }).select('_id');
      const theatreIds = theatresInCity.map((t) => t._id);
      filter.theatre = { $in: theatreIds };
    }

    // Filter by ISO Date (YYYY-MM-DD)
    if (date && typeof date === 'string' && date.trim() !== '') {
      filter.date = date.trim();
    }

    const showtimes = await Showtime.find(filter)
      .populate('movie', 'title slug certification languages formats poster posterUrl accentColor')
      .populate('theatre', 'name slug city location badge facilities')
      .sort({ date: 1, time: 1 });

    return res.status(200).json({
      success: true,
      count: showtimes.length,
      data: showtimes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single showtime by ID
 * @route   GET /api/shows/:id
 * @access  Public
 */
const getShowtimeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid showtime ID.',
      });
    }

    const showtime = await Showtime.findById(id)
      .populate('movie', 'title slug certification languages formats poster posterUrl accentColor')
      .populate('theatre', 'name slug city location badge facilities screens');

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: 'Showtime not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: showtime,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new showtime
 * @route   POST /api/shows
 * @access  Private (Admin only)
 */
const createShowtime = async (req, res, next) => {
  try {
    const {
      movie,
      theatre,
      date,
      time,
      format,
      price,
      totalSeats,
      status,
    } = req.body;

    // 1. Validate required movie reference
    if (!movie || typeof movie !== 'string' || !movie.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Movie reference is required.',
      });
    }

    let movieDoc;
    if (mongoose.Types.ObjectId.isValid(movie.trim())) {
      movieDoc = await Movie.findById(movie.trim());
    } else {
      movieDoc = await Movie.findOne({ slug: movie.trim().toLowerCase() });
    }

    if (!movieDoc) {
      return res.status(400).json({
        success: false,
        message: `Referenced movie '${movie}' not found in database.`,
      });
    }

    // 2. Validate required theatre reference
    if (!theatre || typeof theatre !== 'string' || !theatre.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Theatre reference is required.',
      });
    }

    let theatreDoc;
    if (mongoose.Types.ObjectId.isValid(theatre.trim())) {
      theatreDoc = await Theatre.findById(theatre.trim());
    } else {
      theatreDoc = await Theatre.findOne({ slug: theatre.trim().toLowerCase() });
    }

    if (!theatreDoc) {
      return res.status(400).json({
        success: false,
        message: `Referenced theatre '${theatre}' not found in database.`,
      });
    }

    // 3. Validate date (YYYY-MM-DD format)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!date || typeof date !== 'string' || !dateRegex.test(date.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Valid show date is required in YYYY-MM-DD format.',
      });
    }

    // 4. Validate time
    if (!time || typeof time !== 'string' || !time.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Show start time is required (e.g. 10:45 AM, 02:30 PM).',
      });
    }

    // 5. Validate format
    if (!format || typeof format !== 'string' || !format.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Screening format is required (e.g. Telugu 2D, 3D Atmos).',
      });
    }

    // 6. Validate price
    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Ticket price must be a valid non-negative number.',
      });
    }

    // 7. Validate total seats
    const parsedTotalSeats = totalSeats !== undefined ? Number(totalSeats) : 60;
    if (isNaN(parsedTotalSeats) || parsedTotalSeats < 1) {
      return res.status(400).json({
        success: false,
        message: 'Total seats must be at least 1.',
      });
    }

    const cleanDate = date.trim();
    const cleanTime = time.trim();
    const cleanFormat = format.trim();

    // 8. Conflict Check: Compound uniqueness on { movie, theatre, date, time, format }
    const exactExistingShow = await Showtime.findOne({
      movie: movieDoc._id,
      theatre: theatreDoc._id,
      date: cleanDate,
      time: cleanTime,
      format: cleanFormat,
    });

    if (exactExistingShow) {
      return res.status(400).json({
        success: false,
        message: `A showtime for "${movieDoc.title}" at "${theatreDoc.name}" on ${cleanDate} at ${cleanTime} (${cleanFormat}) already exists.`,
      });
    }

    // 9. Schedule Conflict Check: Prevent double-booking same theatre/screen format at exact same date & time
    const screenConflict = await Showtime.findOne({
      theatre: theatreDoc._id,
      date: cleanDate,
      time: cleanTime,
      format: cleanFormat,
    }).populate('movie', 'title');

    if (screenConflict) {
      return res.status(400).json({
        success: false,
        message: `Schedule conflict: "${theatreDoc.name}" already has a show scheduled for "${screenConflict.movie?.title || 'another movie'}" on ${cleanDate} at ${cleanTime} (${cleanFormat}).`,
      });
    }

    // 10. Status validation
    const validStatuses = ['available', 'filling', 'almost_full', 'sold_out'];
    const chosenStatus = status && validStatuses.includes(status) ? status : 'available';

    // 11. Create Showtime document
    const showtime = await Showtime.create({
      movie: movieDoc._id,
      theatre: theatreDoc._id,
      date: cleanDate,
      time: cleanTime,
      format: cleanFormat,
      price: parsedPrice,
      totalSeats: Math.floor(parsedTotalSeats),
      status: chosenStatus,
      bookedSeats: [],
    });

    await showtime.populate([
      { path: 'movie', select: 'title slug certification languages formats poster posterUrl accentColor' },
      { path: 'theatre', select: 'name slug city location badge facilities' },
    ]);

    return res.status(201).json({
      success: true,
      message: 'Showtime scheduled successfully.',
      data: showtime,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing showtime with strict booking safety guards
 * @route   PUT /api/shows/:id
 * @access  Private (Admin only)
 */
const updateShowtime = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid showtime ID.',
      });
    }

    const showtime = await Showtime.findById(id);

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: 'Showtime not found.',
      });
    }

    const {
      movie,
      theatre,
      date,
      time,
      format,
      price,
      totalSeats,
      status,
    } = req.body;

    const bookedCount = Array.isArray(showtime.bookedSeats) ? showtime.bookedSeats.length : 0;

    // CRITICAL BOOKING SYSTEM PROTECTION:
    // If this showtime already has booked customer seats, protect core schedule identity
    if (bookedCount > 0) {
      const isMovieChanged = movie && movie.toString().trim() !== showtime.movie.toString();
      const isTheatreChanged = theatre && theatre.toString().trim() !== showtime.theatre.toString();
      const isDateChanged = date && date.trim() !== showtime.date;
      const isTimeChanged = time && time.trim() !== showtime.time;

      if (isMovieChanged || isTheatreChanged || isDateChanged || isTimeChanged) {
        return res.status(400).json({
          success: false,
          message: `Cannot modify movie, theatre, date, or time for a show with ${bookedCount} confirmed booked seat(s). Modifying these fields would invalidate existing customer bookings and seat reservations.`,
        });
      }

      if (totalSeats !== undefined) {
        const parsedSeats = Number(totalSeats);
        if (isNaN(parsedSeats) || parsedSeats < bookedCount) {
          return res.status(400).json({
            success: false,
            message: `Total seats cannot be reduced below the ${bookedCount} seat(s) already booked by customers.`,
          });
        }
        showtime.totalSeats = Math.floor(parsedSeats);
      }

      if (price !== undefined) {
        const parsedPrice = Number(price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
          return res.status(400).json({
            success: false,
            message: 'Price must be a valid non-negative number.',
          });
        }
        showtime.price = parsedPrice;
      }

      if (format !== undefined && typeof format === 'string' && format.trim()) {
        showtime.format = format.trim();
      }

      if (status !== undefined) {
        const validStatuses = ['available', 'filling', 'almost_full', 'sold_out'];
        if (validStatuses.includes(status)) {
          showtime.status = status;
        }
      }
    } else {
      // Unbooked showtime: Admin can safely edit any attribute
      if (movie !== undefined) {
        let movieDoc;
        if (mongoose.Types.ObjectId.isValid(movie.trim())) {
          movieDoc = await Movie.findById(movie.trim());
        } else {
          movieDoc = await Movie.findOne({ slug: movie.trim().toLowerCase() });
        }
        if (!movieDoc) {
          return res.status(400).json({
            success: false,
            message: 'Referenced movie not found.',
          });
        }
        showtime.movie = movieDoc._id;
      }

      if (theatre !== undefined) {
        let theatreDoc;
        if (mongoose.Types.ObjectId.isValid(theatre.trim())) {
          theatreDoc = await Theatre.findById(theatre.trim());
        } else {
          theatreDoc = await Theatre.findOne({ slug: theatre.trim().toLowerCase() });
        }
        if (!theatreDoc) {
          return res.status(400).json({
            success: false,
            message: 'Referenced theatre not found.',
          });
        }
        showtime.theatre = theatreDoc._id;
      }

      if (date !== undefined) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!date || typeof date !== 'string' || !dateRegex.test(date.trim())) {
          return res.status(400).json({
            success: false,
            message: 'Show date must be in YYYY-MM-DD format.',
          });
        }
        showtime.date = date.trim();
      }

      if (time !== undefined) {
        if (!time || typeof time !== 'string' || !time.trim()) {
          return res.status(400).json({
            success: false,
            message: 'Show start time cannot be empty.',
          });
        }
        showtime.time = time.trim();
      }

      if (format !== undefined) {
        if (!format || typeof format !== 'string' || !format.trim()) {
          return res.status(400).json({
            success: false,
            message: 'Format cannot be empty.',
          });
        }
        showtime.format = format.trim();
      }

      if (price !== undefined) {
        const parsedPrice = Number(price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
          return res.status(400).json({
            success: false,
            message: 'Price must be a valid non-negative number.',
          });
        }
        showtime.price = parsedPrice;
      }

      if (totalSeats !== undefined) {
        const parsedSeats = Number(totalSeats);
        if (isNaN(parsedSeats) || parsedSeats < 1) {
          return res.status(400).json({
            success: false,
            message: 'Total seats must be at least 1.',
          });
        }
        showtime.totalSeats = Math.floor(parsedSeats);
      }

      if (status !== undefined) {
        const validStatuses = ['available', 'filling', 'almost_full', 'sold_out'];
        if (validStatuses.includes(status)) {
          showtime.status = status;
        }
      }

      // Conflict Check with other shows (excluding this show)
      const conflict = await Showtime.findOne({
        _id: { $ne: showtime._id },
        theatre: showtime.theatre,
        date: showtime.date,
        time: showtime.time,
        format: showtime.format,
      }).populate('movie', 'title');

      if (conflict) {
        return res.status(400).json({
          success: false,
          message: `Schedule conflict: This theatre already has a show scheduled for "${conflict.movie?.title || 'another movie'}" on ${showtime.date} at ${showtime.time} (${showtime.format}).`,
        });
      }
    }

    await showtime.save();

    await showtime.populate([
      { path: 'movie', select: 'title slug certification languages formats poster posterUrl accentColor' },
      { path: 'theatre', select: 'name slug city location badge facilities screens' },
    ]);

    return res.status(200).json({
      success: true,
      message: 'Showtime updated successfully.',
      data: showtime,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShowtimes,
  getShowtimeById,
  createShowtime,
  updateShowtime,
};

