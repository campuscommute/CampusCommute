const router = require('express').Router();
const ctrl   = require('../controllers/admin.controller');
const { protect, requireAdmin } = require('../middleware/auth.middleware');

// All admin routes require authentication + admin role
router.use(protect, requireAdmin);

router.get('/stats',                           ctrl.getStats);
router.get('/verifications',                   ctrl.getPendingVerifications);
router.patch('/verifications/:userId',         ctrl.reviewVerification);
router.get('/users',                           ctrl.getAllUsers);
router.patch('/users/:id/toggle-status',       ctrl.toggleUserStatus);
router.get('/rides',                           ctrl.getAllRides);
router.get('/reports',                         ctrl.getReports);
router.post('/reports',  protect,              ctrl.fileReport);   // any auth user can file
router.patch('/reports/:id',                   ctrl.updateReport);

module.exports = router;
