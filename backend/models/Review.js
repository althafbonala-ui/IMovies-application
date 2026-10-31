const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
      index: true,
    },
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Review must belong to a movie'],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating between 1 and 5 stars'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be an integer between 1 and 5',
      },
    },
    reviewText: {
      type: String,
      required: [true, 'Please provide a review description'],
      trim: true,
      minlength: [2, 'Review text must be at least 2 characters long'],
      maxlength: [1000, 'Review text cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring a user can submit only one review per movie
reviewSchema.index({ movie: 1, user: 1 }, { unique: true });

// Alias virtual for reviewText
reviewSchema.virtual('review').get(function () {
  return this.reviewText;
});

reviewSchema.set('toJSON', { virtuals: true });
reviewSchema.set('toObject', { virtuals: true });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
