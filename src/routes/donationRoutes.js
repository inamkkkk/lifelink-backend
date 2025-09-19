const express = require('express');
const { scheduleDonation, getDonationDetails, cancelDonation } = require('../controllers/donationController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const { validate, scheduleDonationSchema, cancelDonationSchema } = require('../middlewares/validationMiddleware');

const router = express.Router();

// Donor can schedule a donation
router.post('/schedule', protect, authorizeRoles('donor'), validate(scheduleDonationSchema), scheduleDonation);
// Anyone involved (donor, hospital_admin, system_admin) can get details
router.get('/:id', protect, authorizeRoles('donor', 'hospital_admin', 'system_admin'), getDonationDetails);
// Donor or authorized admin can cancel a donation
router.put('/:id/cancel', protect, authorizeRoles('donor', 'hospital_admin', 'system_admin'), validate(cancelDonationSchema), cancelDonation);

module.exports = router;