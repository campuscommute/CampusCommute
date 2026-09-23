const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT for a user
 * @param {string} id  - MongoDB user _id
 * @returns {string}   - signed token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Strip sensitive fields and return a safe user object
 */
const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.__v;
  return obj;
};

/**
 * Generate a 4-digit OTP string
 */
const generateOTP = () => {
  return String(Math.floor(1000 + Math.random() * 9000));
};

module.exports = { generateToken, sanitizeUser, generateOTP };
