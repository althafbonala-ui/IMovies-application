const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: [true, 'Please provide a unique slug for the movie'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide movie title'],
      trim: true,
      index: true,
    },
    tagline: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['now_showing', 'upcoming'],
        message: 'Status must be either now_showing or upcoming',
      },
      default: 'now_showing',
      index: true,
    },
    isHero: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      min: [0, 'Rating cannot be less than 0'],
      max: [10, 'Rating cannot be greater than 10'],
      default: null,
    },
    voteCount: {
      type: String,
      default: '0',
    },
    expectedRating: {
      type: String,
      default: '',
    },
    certification: {
      type: String,
      enum: {
        values: ['U', 'UA', 'UA 13+', 'UA 16+', 'A', 'S'],
        message: 'Invalid certification rating',
      },
      default: 'UA',
    },
    languages: {
      type: [String],
      required: [true, 'Please provide at least one language'],
      index: true,
    },
    formats: {
      type: [String],
      default: ['2D'],
    },
    genres: {
      type: [String],
      required: [true, 'Please provide at least one genre'],
      index: true,
    },
    duration: {
      type: String,
      default: 'TBA',
    },
    releaseDate: {
      type: String,
      required: [true, 'Please provide a release date'],
    },
    poster: {
      type: String,
      required: [true, 'Please provide a poster image URL or path'],
    },
    banner: {
      type: String,
      required: [true, 'Please provide a banner image URL or path'],
    },
    accentColor: {
      type: String,
      default: '#f84464',
    },
    director: {
      type: String,
      trim: true,
      default: '',
    },
    musicDirector: {
      type: String,
      trim: true,
      default: '',
    },
    cast: [
      {
        name: { type: String, required: true },
        role: { type: String, default: '' },
        initials: { type: String, default: '' },
      },
    ],
    synopsis: {
      type: String,
      default: '',
    },
    criticConsensus: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Text index on title, director, and genres for quick free-text search queries
movieSchema.index({ title: 'text', director: 'text', genres: 'text' });

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;
