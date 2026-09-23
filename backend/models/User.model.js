const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Invalid Indian phone number'],
    },
    college: {
      type: String,
      trim: true,
    },
    enrollmentNo: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    avatar: {
      type: String,   // URL / path
      default: null,
    },
    // Verification
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: ['unsubmitted', 'pending', 'approved', 'rejected'],
      default: 'unsubmitted',
    },
    collegeIdImage: { type: String, default: null },
    selfieImage:    { type: String, default: null },
    verifiedAt:     { type: Date,   default: null },
    verifiedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    // Profile
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRides:   { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    // Safety
    emergencyContact: {
      name:  { type: String },
      phone: { type: String },
    },
    savedRoutes: [
      {
        from: String,
        to:   String,
        time: String,
        days: [String],
      },
    ],
    // Preferences
    preferences: {
      womenOnly:        { type: Boolean, default: false },
      notifications:    { type: Boolean, default: true },
      rideUpdates:      { type: Boolean, default: true },
      shareLocationAuto:{ type: Boolean, default: true },
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    passwordResetToken:   { type: String, select: false },
    passwordResetExpires: { type: Date,   select: false },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Hash password before save ─────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Compare password ──────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// ─── Virtual: initials ────────────────────────────────────────────────────
userSchema.virtual('initials').get(function () {
  return this.name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
});

module.exports = mongoose.model('User', userSchema);
