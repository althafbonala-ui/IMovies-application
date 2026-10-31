const mongoose = require('mongoose');
const Review = require('../models/Review');
const Movie = require('../models/Movie');

/**
 * Helper to resolve a movie by MongoDB ObjectId or unique slug
 * @param {string} identifier - Movie ObjectId or slug
 * @returns {Promise<Document|null>}
 */
const resolveMovie = async (identifier) => {
  if (!identifier || typeof identifier !== 'string') {
    return null;
  }

  let movie = null;
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    movie = await Movie.findById(identifier);
  }

  if (!movie) {
    movie = await Movie.findOne({ slug: identifier.toLowerCase().trim() });
  }

  return movie;
};

/**
 * Helper to compute average rating, total review count, and rating distribution for a movie
 * @param {ObjectId} movieId - MongoDB ObjectId of the movie
 * @returns {Promise<{averageRating: number, totalReviews: number, ratingBreakdown: object}>}
 */
const getMovieReviewStats = async (movieId) => {
  const mId = new mongoose.Types.ObjectId(movieId);

  const [aggregateResult, breakdownResult] = await Promise.all([
    Review.aggregate([
      { $match: { movie: mId } },
      {
        $group: {
          _id: '$movie',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]),
    Review.aggregate([
      { $match: { movie: mId } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  breakdownResult.forEach((item) => {
    if (ratingBreakdown[item._id] !== undefined) {
      ratingBreakdown[item._id] = item.count;
    }
  });

  if (aggregateResult.length > 0) {
    return {
      averageRating: Math.round(aggregateResult[0].averageRating * 10) / 10,
      totalReviews: aggregateResult[0].totalReviews,
      ratingBreakdown,
    };
  }

  return {
    averageRating: 0,
    totalReviews: 0,
    ratingBreakdown,
  };
};

/**
 * @desc    Get all reviews and rating statistics for a movie
 * @route   GET /api/movies/:movieId/reviews or GET /api/reviews/movie/:movieId
 * @access  Public
 */
const getReviewsForMovie = async (req, res, next) => {
  try {
    const movieIdParam = req.params.movieId || req.params.id || req.query.movieId;

    if (!movieIdParam) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a movie identifier (ID or slug)',
      });
    }

    const movie = await resolveMovie(movieIdParam);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: `Movie not found with identifier '${movieIdParam}'`,
      });
    }

    const reviews = await Review.find({ movie: movie._id })
      .populate('user', '_id name email')
      .sort({ createdAt: -1 });

    const stats = await getMovieReviewStats(movie._id);

    return res.status(200).json({
      success: true,
      count: reviews.length,
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
      ratingBreakdown: stats.ratingBreakdown,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new review for a movie
 * @route   POST /api/movies/:movieId/reviews or POST /api/reviews
 * @access  Private (Authenticated users only)
 */
const createReview = async (req, res, next) => {
  try {
    const movieIdParam = req.params.movieId || req.body.movieId;

    if (!movieIdParam) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid movie identifier',
      });
    }

    const movie = await resolveMovie(movieIdParam);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: `Movie not found with identifier '${movieIdParam}'`,
      });
    }

    // Always derive user ID from the verified JWT (req.user)
    const userId = req.user._id;

    // Validate rating (1-5 integer)
    const { rating } = req.body;
    if (rating === undefined || rating === null || rating === '') {
      return res.status(400).json({
        success: false,
        message: 'Rating is required. Please select a rating between 1 and 5 stars.',
      });
    }

    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5 stars.',
      });
    }

    // Validate review text (min 2, max 1000 characters)
    const rawText = req.body.reviewText || req.body.review || req.body.comment;
    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Review text is required.',
      });
    }

    const trimmedText = rawText.trim();
    if (trimmedText.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Review text must be at least 2 characters long.',
      });
    }

    if (trimmedText.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Review text cannot exceed 1000 characters.',
      });
    }

    // Check if user already reviewed this movie
    const existingReview = await Review.findOne({
      movie: movie._id,
      user: userId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this movie. You can edit your existing review instead.',
      });
    }

    // Create review
    const newReview = await Review.create({
      movie: movie._id,
      user: userId,
      rating: parsedRating,
      reviewText: trimmedText,
    });

    const populatedReview = await Review.findById(newReview._id).populate(
      'user',
      '_id name email'
    );

    const stats = await getMovieReviewStats(movie._id);

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      data: populatedReview,
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
      ratingBreakdown: stats.ratingBreakdown,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this movie. You can edit your existing review instead.',
      });
    }
    next(error);
  }
};

/**
 * @desc    Update a user's own review
 * @route   PUT /api/reviews/:id or PUT /api/movies/:movieId/reviews/:id
 * @access  Private (Authenticated author only)
 */
const updateReview = async (req, res, next) => {
  try {
    const reviewId = req.params.id || req.params.reviewId;

    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid review identifier',
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Verify ownership: user can only edit their own review
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only edit your own review.',
      });
    }

    const { rating } = req.body;
    const rawText = req.body.reviewText !== undefined ? req.body.reviewText : req.body.review;

    if (rating === undefined && rawText === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either rating or review text to update.',
      });
    }

    // Validate rating if provided
    if (rating !== undefined && rating !== null) {
      const parsedRating = Number(rating);
      if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be an integer between 1 and 5 stars.',
        });
      }
      review.rating = parsedRating;
    }

    // Validate reviewText if provided
    if (rawText !== undefined) {
      if (typeof rawText !== 'string' || !rawText.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Review text cannot be empty.',
        });
      }

      const trimmedText = rawText.trim();
      if (trimmedText.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Review text must be at least 2 characters long.',
        });
      }

      if (trimmedText.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Review text cannot exceed 1000 characters.',
        });
      }

      review.reviewText = trimmedText;
    }

    await review.save();

    const populatedReview = await Review.findById(review._id).populate(
      'user',
      '_id name email'
    );

    const stats = await getMovieReviewStats(review.movie);

    return res.status(200).json({
      success: true,
      message: 'Review updated successfully!',
      data: populatedReview,
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
      ratingBreakdown: stats.ratingBreakdown,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a user's own review
 * @route   DELETE /api/reviews/:id or DELETE /api/movies/:movieId/reviews/:id
 * @access  Private (Authenticated author only)
 */
const deleteReview = async (req, res, next) => {
  try {
    const reviewId = req.params.id || req.params.reviewId;

    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid review identifier',
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Verify ownership: user can only delete their own review
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only delete your own review.',
      });
    }

    const movieId = review.movie;
    await Review.findByIdAndDelete(reviewId);

    const stats = await getMovieReviewStats(movieId);

    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully!',
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
      ratingBreakdown: stats.ratingBreakdown,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReviewsForMovie,
  createReview,
  updateReview,
  deleteReview,
  getMovieReviewStats,
};
