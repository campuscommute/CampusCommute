const router = require('express').Router();
const ctrl   = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const upload  = require('../middleware/upload.middleware');

// Public
router.get('/:id', ctrl.getProfile);

// Protected
router.put('/me',             protect, upload.single('avatar'), ctrl.updateProfile);
router.get('/me/rides',       protect, ctrl.getMyRides);
router.get('/me/stats',       protect, ctrl.getMyStats);
router.post('/me/verify',     protect,
  upload.fields([
    { name: 'collegeId', maxCount: 1 },
    { name: 'selfie',    maxCount: 1 },
  ]),
  ctrl.submitVerification
);

module.exports = router;
