const jwt  = require('jsonwebtoken');
const User = require('../models/User.model');

// ─── Verify JWT ────────────────────────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Token invalid — user not found.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// ─── Require verified student ──────────────────────────────────────────────
const requireVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'You must be a verified student to perform this action.',
    });
  }
  next();
};

// ─── Require admin role ────────────────────────────────────────────────────
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  next();
};

// ─── Women-only route guard ────────────────────────────────────────────────
const requireFemale = (req, res, next) => {
  if (req.user.gender !== 'female') {
    return res.status(403).json({
      success: false,
      message: 'This feature is available for female students only.',
    });
  }
  next();
};

module.exports = { protect, requireVerified, requireAdmin, requireFemale };
