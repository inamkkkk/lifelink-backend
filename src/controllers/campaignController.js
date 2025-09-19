const asyncHandler = require('../utils/asyncHandler');
const campaignService = require('../services/campaignService');

exports.createCampaign = asyncHandler(async (req, res, next) => {
  const campaign = await campaignService.createCampaign(req.body);
  res.status(201).json({ success: true, data: campaign });
});

exports.getCampaignDetails = asyncHandler(async (req, res, next) => {
  const campaign = await campaignService.getCampaignDetails(req.params.id);
  res.status(200).json({ success: true, data: campaign });
});

// A route to join a campaign might be useful, e.g., POST /campaigns/:id/join
exports.joinCampaign = asyncHandler(async (req, res, next) => {
  const campaignId = req.params.id;
  const donorId = req.user.id; // Assuming the user joining is a donor
  const updatedCampaign = await campaignService.addParticipantToCampaign(campaignId, donorId);
  res.status(200).json({ success: true, data: updatedCampaign });
});
