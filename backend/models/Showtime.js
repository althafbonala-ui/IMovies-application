const mongoose = require('mongoose');

const showtimeSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Showtime must reference a valid Movie'],
      index: true,
    },
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: [true, 'Showtime must reference a valid Theatre'],
      index: true,
    },
    // Stored as ISO date string: YYYY-MM-DD
    date: {
      type: String,
      required: [true, 'Please provide show date in YYYY-MM-DD format'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'],
      index: true,
    },
    time: {
      type: String,
      required: [true, 'Please provide show time (e.g. 10:45 AM)'],
      trim: true,
    },
    format: {
      type: String,
      required: [true, 'Please provide screen format (e.g. Telugu 2D, Telugu 3D Atmos)'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Please provide ticket price'],
      min: [0, 'Price cannot be negative'],
      default: 180,
    },
    status: {
      type: String,
      enum: {
        values: ['available', 'filling', 'almost_full', 'sold_out'],
        message: 'Status must be available, filling, almost_full, or sold_out',
      },
      default: 'available',
    },
    totalSeats: {
      type: Number,
      default: 60,
      min: [1, 'Total seats must be greater than zero'],
    },
    bookedSeats: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring idempotency on movie, theatre, date, time, and format
showtimeSchema.index(
  { movie: 1, theatre: 1, date: 1, time: 1, format: 1 },
  { unique: true, name: 'uniq_movie_theatre_date_time_format' }
);

const Showtime = mongoose.model('Showtime', showtimeSchema);

module.exports = Showtime;
