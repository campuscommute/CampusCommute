const router  = require('express').Router();
const { body } = require('express-validator');
const ctrl    = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const validate    = require('../middleware/validate.middleware');

// ── Validators ──────────────────────────────────────────────────────────────
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 60 }),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('phone').optional().matches(/^[6-9]\d{9}$/).withMessage('Invalid Indian mobile number'),
];

const loginRules = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

// ── Routes ──────────────────────────────────────────────────────────────────
router.post('/register', registerRules,        validate, ctrl.register);
router.post('/login',    loginRules,           validate, ctrl.login);
router.post('/logout',   protect,                       ctrl.logout);
router.get( '/me',       protect,                       ctrl.getMe);
router.put( '/change-password', protect, changePasswordRules, validate, ctrl.changePassword);

module.exports = router;
