const express = require('express');
const { createRequest, getRequestDetails, matchDonors } = require('../controllers/requestController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const { validate, createRequestSchema } = require('../middlewares/validationMiddleware');

const router = express.Router();

// Recipient or hospital_admin can create a blood request
router.post('/create', protect, authorizeRoles('recipient', 'hospital_admin'), validate(createRequestSchema), createRequest);

// Anyone involved (recipient, hospital_admin, system_admin) can get details
router.get('/:id', protect, authorizeRoles('recipient', 'hospital_admin', 'system_admin'), getRequestDetails);

// Hospital admin or system admin can trigger donor matching for a request
router.post('/match/:id', protect, authorizeRoles('hospital_admin', 'system_admin'), matchDonors); // Changed GET to POST for matching action

module.exports = router;