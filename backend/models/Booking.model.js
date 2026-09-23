const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: true,
    },
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    seatsBooked: {
      type: Number,
      default: 1,
      min: 1,
      max: 4,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    // Counter offer
    originalPrice:   { type: Number },
    offeredPrice:    { type: Number },
    counterOfferStatus: {
      type: String,
      enum: ['none', 'pending', 'accepted', 'rejected'],
      default: 'none',
    },
    // OTP
    otp: {
      code:      { type: String, select: false },
      expiresAt: { type: Date },
      verified:  { type: Boolean, default: false },
      verifiedAt:{ type: Date },
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled'],
      default: 'pending',
    },
    cancelledBy:     { type: String, enum: ['passenger', 'driver', 'admin', null], default: null },
    cancellationReason: { type: String },
    cancelledAt:     { type: Date },
    // Rating (post-trip)
    passengerRating: {
      score:   { type: Number, min: 1, max: 5 },
      comment: { type: String, maxlength: 300 },
      ratedAt: { type: Date },
    },
    driverRating: {
      score:   { type: Number, min: 1, max: 5 },
      comment: { type: String, maxlength: 300 },
      ratedAt: { type: Date },
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

bookingSchema.index({ ride: 1, passenger: 1 });
bookingSchema.index({ passenger: 1, status: 1 });
bookingSchema.index({ ride: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
