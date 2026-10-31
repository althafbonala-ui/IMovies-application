const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingRef: {
      type: String,
      required: [true, 'Please provide a unique booking reference'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
      default: () =>
        `IMOV-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking must belong to a registered User'],
      index: true,
    },
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Booking must reference a valid Movie'],
      index: true,
    },
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: [true, 'Booking must reference a valid Theatre'],
      index: true,
    },
    showtime: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Showtime',
      required: [true, 'Booking must reference a valid Showtime slot'],
      index: true,
    },
    showDate: {
      type: String,
      required: [true, 'Please provide show date in YYYY-MM-DD format'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'],
    },
    showTime: {
      type: String,
      required: [true, 'Please provide show time'],
      trim: true,
    },
    format: {
      type: String,
      default: '2D',
      trim: true,
    },
    seats: {
      type: [String],
      required: [true, 'Please select at least one seat'],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length > 0;
        },
        message: 'A booking must have at least one seat selected',
      },
    },
    seatCount: {
      type: Number,
      required: true,
      min: [1, 'Seat count must be at least 1'],
      default: function () {
        return this.seats ? this.seats.length : 1;
      },
    },
    subtotal: {
      type: Number,
      required: [true, 'Please provide ticket subtotal amount'],
      min: [0, 'Subtotal cannot be negative'],
    },
    convenienceFee: {
      type: Number,
      default: 0,
      min: [0, 'Convenience fee cannot be negative'],
    },
    gst: {
      type: Number,
      default: 0,
      min: [0, 'GST cannot be negative'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Please provide total amount payable'],
      min: [0, 'Total amount cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'cancelled'],
        message: 'Status must be pending, confirmed, or cancelled',
      },
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['pending', 'paid', 'refunded', 'failed'],
        message: 'Payment status must be pending, paid, refunded, or failed',
      },
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      trim: true,
      default: 'Demo Payment Pending',
    },
    demoTransactionId: {
      type: String,
      trim: true,
      default: '',
    },
    paidAt: {
      type: Date,
    },
    failureReason: {
      type: String,
      trim: true,
      default: '',
    },
    emailDelivery: {
      status: {
        type: String,
        enum: {
          values: ['pending', 'processing', 'sent', 'failed'],
          message: 'Email delivery status must be pending, processing, sent, or failed',
        },
        default: 'pending',
        index: true,
      },
      sentAt: {
        type: Date,
      },
      recipientEmail: {
        type: String,
        trim: true,
        lowercase: true,
        default: '',
      },
      error: {
        type: String,
        trim: true,
        default: '',
      },
      attempts: {
        type: Number,
        default: 0,
      },
      lastAttemptAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Guarantee seatCount is always synchronized with the seats array
bookingSchema.pre('validate', function (next) {
  if (Array.isArray(this.seats)) {
    this.seatCount = this.seats.length;
  }
  next();
});

// Compound index for retrieving a user's bookings sorted chronologically
bookingSchema.index({ user: 1, createdAt: -1 });

// Compound index for checking active bookings against a specific showtime
bookingSchema.index({ showtime: 1, status: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
