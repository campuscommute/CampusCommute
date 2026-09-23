const User    = require('../models/User.model');
const Ride    = require('../models/Ride.model');
const Booking = require('../models/Booking.model');
const Report  = require('../models/Report.model');

// ─── GET /api/admin/stats ─────────────────────────────────────────────────
exports.getStats = async (req, res, next) => {
  try {
    const [
      totalStudents,
      totalRides,
      activeRides,
      pendingVerifications,
      totalBookings,
      completedRides,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Ride.countDocuments(),
      Ride.countDocuments({ status: 'active' }),
      User.countDocuments({ verificationStatus: 'pending' }),
      Booking.countDocuments(),
      Ride.countDocuments({ status: 'completed' }),
    ]);

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalRides,
        activeRides,
        pendingVerifications,
        totalBookings,
        completedRides,
      },
    });
  } catch (err) { next(err); }
};

// ─── GET /api/admin/verifications ────────────────────────────────────────
exports.getPendingVerifications = async (req, res, next) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status !== 'all') filter.verificationStatus = status;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('name email college enrollmentNo gender verificationStatus collegeIdImage selfieImage createdAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

// ─── PATCH /api/admin/verifications/:userId — approve or reject ───────────
exports.reviewVerification = async (req, res, next) => {
  try {
    const { action, reason } = req.body; // action: 'approve' | 'reject'
    const user = await User.findById(req.params.userId);

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.verificationStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'No pending verification for this user.' });
    }

    if (action === 'approve') {
      user.verificationStatus = 'approved';
      user.isVerified = true;
      user.verifiedAt = new Date();
      user.verifiedBy = req.user._id;
    } else {
      user.verificationStatus = 'rejected';
      user.isVerified = false;
    }

    await user.save();

    res.json({
      success: true,
      message: action === 'approve' ? 'User verified successfully.' : 'Verification rejected.',
      user: { _id: user._id, name: user.name, verificationStatus: user.verificationStatus, isVerified: user.isVerified },
    });
  } catch (err) { next(err); }
};

// ─── GET /api/admin/users ─────────────────────────────────────────────────
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, isVerified, page = 1, limit = 20, search } = req.query;
    const filter = {};

    if (role)      filter.role = role;
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    if (search)    filter.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { college:{ $regex: search, $options: 'i' } },
    ];

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -collegeIdImage -selfieImage -passwordResetToken -passwordResetExpires')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

// ─── PATCH /api/admin/users/:id/deactivate ────────────────────────────────
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot modify admin accounts.' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'}.`,
      isActive: user.isActive,
    });
  } catch (err) { next(err); }
};

// ─── GET /api/admin/rides ─────────────────────────────────────────────────
exports.getAllRides = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const [rides, total] = await Promise.all([
      Ride.find(filter)
        .populate('driver', 'name college isVerified')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Ride.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: rides,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

// ─── GET /api/admin/reports ───────────────────────────────────────────────
exports.getReports = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('reporter',     'name college')
        .populate('reportedUser', 'name college')
        .populate('ride',         'from to date time')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Report.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: reports,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

// ─── POST /api/admin/reports — file a report (any auth user) ──────────────
exports.fileReport = async (req, res, next) => {
  try {
    const { reportedUserId, rideId, bookingId, type, description } = req.body;

    const report = await Report.create({
      reporter:     req.user._id,
      reportedUser: reportedUserId,
      ride:         rideId,
      booking:      bookingId,
      type,
      description,
    });

    res.status(201).json({ success: true, message: 'Report submitted. We will review within 24 hours.', report });
  } catch (err) { next(err); }
};

// ─── PATCH /api/admin/reports/:id — resolve / escalate ───────────────────
exports.updateReport = async (req, res, next) => {
  try {
    const { status, resolution } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });

    report.status     = status;
    report.resolution = resolution;
    report.resolvedBy = req.user._id;
    report.resolvedAt = new Date();
    await report.save();

    res.json({ success: true, message: 'Report updated.', report });
  } catch (err) { next(err); }
};
