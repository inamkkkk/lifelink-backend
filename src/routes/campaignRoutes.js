const express = require('express');
const { createCampaign, getCampaignDetails, joinCampaign } = require('../controllers/campaignController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const { validate, createCampaignSchema } = require('../middlewares/validationMiddleware');

const router = express.Router();

// Only hospital admin or system admin can create campaigns
router.post('/create', protect, authorizeRoles('hospital_admin', 'system_admin'), validate(createCampaignSchema), createCampaign);
router.get('/:id', protect, getCampaignDetails); // Anyone can view campaign details
// Donor can join a campaign
router.post('/:id/join', protect, authorizeRoles('donor'), joinCampaign);

module.exports = router;
