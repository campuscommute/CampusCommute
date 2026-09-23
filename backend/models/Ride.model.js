const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    from: {
      label: { type: String, required: true, trim: true },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    to: {
      label: { type: String, required: true, trim: true },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
      trim: true,
    },
    totalSeats: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },
    availableSeats: {
      type: Number,
      required: true,
      min: 0,
    },
    pricePerSeat: {
      type: Number,
      required: true,
      min: 0,
    },
    preference: {
      type: String,
      enum: ['everyone', 'women-only'],
      default: 'everyone',
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringDays: {
      type: [String],
      enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      default: [],
    },
    status: {
      type: String,
      enum: ['upcoming', 'active', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    vehicle: {
      model:  { type: String, trim: true },
      color:  { type: String, trim: true },
      plate:  { type: String, trim: true, uppercase: true },
    },
    // Live tracking
    currentLocation: {
      lat: { type: Number },
      lng: { type: Number },
      updatedAt: { type: Date },
    },
    startedAt:   { type: Date },
    completedAt: { type: Date },
    // Stats
    distance: { type: Number }, // km
    duration: { type: Number }, // minutes
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Index for geo/time searches ────────────────────────────────────────────
rideSchema.index({ 'from.label': 'text', 'to.label': 'text' });
rideSchema.index({ date: 1, status: 1 });
rideSchema.index({ driver: 1 });

// ─── Virtual: bookedSeats ───────────────────────────────────────────────────
rideSchema.virtual('bookedSeats').get(function () {
  return this.totalSeats - this.availableSeats;
});

module.exports = mongoose.model('Ride', rideSchema);
