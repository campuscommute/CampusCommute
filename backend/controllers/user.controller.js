const User    = require('../models/User.model');
const Booking = require('../models/Booking.model');
const { sanitizeUser } = require('../utils/token.util');

// ─── GET /api/users/:id — public profile ─────────────────────────────────
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(
      'name college gender isVerified rating totalRides totalReviews avatar createdAt'
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

// ─── PUT /api/users/me — update own profile ───────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'phone', 'college', 'enrollmentNo', 'emergencyContact', 'savedRoutes', 'preferences'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    if (req.file) updates.avatar = req.file.path;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true, runValidators: true,
    });
    res.json({ success: true, message: 'Profile updated.', user: sanitizeUser(user) });
  } catch (err) { next(err); }
};

// ─── POST /api/users/me/verify — submit verification docs ─────────────────
exports.submitVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.verificationStatus === 'approved') {
      return res.status(400).json({ success: false, message: 'You are already verified.' });
    }

    const { college, enrollmentNo } = req.body;
    if (college)      user.college      = college;
    if (enrollmentNo) user.enrollmentNo = enrollmentNo;

    if (req.files?.collegeId?.[0]) user.collegeIdImage = req.files.collegeId[0].path;
    if (req.files?.selfie?.[0])    user.selfieImage    = req.files.selfie[0].path;

    if (!user.collegeIdImage) {
      return res.status(400).json({ success: false, message: 'College ID image is required.' });
    }

    user.verificationStatus = 'pending';
    await user.save();

    res.json({ success: true, message: 'Verification submitted. Under review within 30 minutes.' });
  } catch (err) { next(err); }
};

// ─── GET /api/users/me/rides — own ride history ───────────────────────────
exports.getMyRides = async (req, res, next) => {
  try {
    const { status, type = 'passenger', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { passenger: req.user._id };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate({
        path: 'ride',
        populate: { path: 'driver', select: 'name college isVerified rating avatar gender' },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: bookings,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

// ─── GET /api/users/me/stats ─────────────────────────────────────────────
exports.getMyStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('rating totalRides totalReviews');
    const completedBookings = await Booking.countDocuments({ passenger: req.user._id, status: 'completed' });

    res.json({
      success: true,
      stats: {
        rating:           user.rating,
        totalRidesAsPassenger: completedBookings,
        totalReviews:     user.totalReviews,
      },
    });
  } catch (err) { next(err); }
};
