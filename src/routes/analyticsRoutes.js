const express = require('express');
const { donationStats, requestStats, hospitalStats } = require('../controllers/analyticsController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

// Only system admins can access global analytics
router.get('/donations', protect, authorizeRoles('system_admin'), donationStats);
router.get('/requests', protect, authorizeRoles('system_admin'), requestStats);

// TODO: Implement authorization for hospital stats to allow hospital admins to view their own hospital's stats
// and system admins to view any hospital's stats.
// The current implementation already covers this with authorizeRoles('hospital_admin', 'system_admin').
// Ensure the hospitalStats controller correctly handles the authorization logic and distinguishes
// between a hospital admin requesting their own stats and a system admin requesting any stats.
router.get('/hospital/:id', protect, authorizeRoles('hospital_admin', 'system_admin'), hospitalStats);

module.exports = router;