const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/booking.controller');
const { protect, requireVerified } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

const bookingRules = [
  body('rideId').notEmpty().withMessage('Ride ID is required'),
  body('seatsBooked').optional().isInt({ min: 1, max: 4 }).withMessage('Invalid seat count'),
  body('offeredPrice').optional().isFloat({ min: 0 }).withMessage('Offered price must be positive'),
];

const ratingRules = [
  body('score').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isLength({ max: 300 }),
];

router.post('/',                    protect, requireVerified, bookingRules, validate, ctrl.requestBooking);
router.get('/me',                   protect,                               ctrl.getMyBookings);
router.get('/:id',                  protect,                               ctrl.getBooking);
router.patch('/:id/verify-otp',     protect,                               ctrl.verifyOTP);
router.patch('/:id/cancel',         protect,                               ctrl.cancelBooking);
router.patch('/:id/counter-offer',  protect,                               ctrl.respondCounterOffer);
router.post('/:id/rate',            protect, ratingRules, validate,        ctrl.rateRide);

module.exports = router;
