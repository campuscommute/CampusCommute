const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    type: {
      type: String,
      required: true,
      enum: [
        'Late Pickup',
        'No Show',
        'Unsafe Driving',
        'Route Change',
        'Harassment',
        'Wrong Vehicle',
        'OTP Fraud',
        'Other',
      ],
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['open', 'reviewing', 'resolved', 'escalated', 'dismissed'],
      default: 'open',
    },
    resolvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolution:  { type: String, maxlength: 500 },
    resolvedAt:  { type: Date },
  },
  { timestamps: true }
);

reportSchema.index({ reporter: 1 });
reportSchema.index({ reportedUser: 1 });
reportSchema.index({ status: 1 });

module.exports = mongoose.model('Report', reportSchema);
