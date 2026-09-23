const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/ride.controller');
const { protect, requireVerified } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

const rideRules = [
  body('from.label').trim().notEmpty().withMessage('Pickup location is required'),
  body('to.label').trim().notEmpty().withMessage('Destination is required'),
  body('date').isISO8601().withMessage('Valid date required'),
  body('time').trim().notEmpty().withMessage('Time is required'),
  body('totalSeats').isInt({ min: 1, max: 6 }).withMessage('Seats must be between 1 and 6'),
  body('pricePerSeat').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('preference').optional().isIn(['everyone', 'women-only']),
];

// Public
router.get('/',            ctrl.searchRides);

// Protected — specific paths before parameterised /:id to avoid shadowing
router.get('/driver/me',   protect,                             ctrl.getMyOfferedRides);
router.post('/',           protect, requireVerified, rideRules, validate, ctrl.createRide);

router.get('/:id',         ctrl.getRide);
router.put('/:id',         protect, requireVerified,            ctrl.updateRide);
router.delete('/:id',      protect, requireVerified,            ctrl.cancelRide);
router.patch('/:id/start',    protect, requireVerified,         ctrl.startRide);
router.patch('/:id/complete', protect, requireVerified,         ctrl.completeRide);

module.exports = router;
