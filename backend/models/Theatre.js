const mongoose = require('mongoose');

const theatreSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: [true, 'Please provide a unique slug for the theatre'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide the cinema / theatre name'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'Please provide the city where the theatre is located'],
      trim: true,
      index: true,
    },
    location: {
      type: String,
      required: [true, 'Please provide the street address / landmark'],
      trim: true,
    },
    badge: {
      type: String,
      trim: true,
      default: '',
    },
    formats: {
      type: [String],
      default: ['2D'],
    },
    facilities: {
      type: [String],
      default: ['M-Ticket'],
    },
    screens: {
      type: Number,
      default: 1,
      min: [1, 'Theatre must have at least 1 screen'],
    },
  },
  {
    timestamps: true,
  }
);

const Theatre = mongoose.model('Theatre', theatreSchema);

module.exports = Theatre;
