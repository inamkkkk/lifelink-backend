const express = require('express');
const { donationStats, requestStats, hospitalStats } = require('../controllers/analyticsController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

// Only system admins can access global analytics
router.get('/donations', protect, authorizeRoles('system_admin'), donationStats);
router.get('/requests', protect, authorizeRoles('system_admin'), requestStats);
// Hospital admins can view their hospital's stats, system admins can view any hospital's stats
router.get('/hospital/:id', protect, authorizeRoles('hospital_admin', 'system_admin'), hospitalStats);

module.exports = router;
