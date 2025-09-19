const asyncHandler = require('../utils/asyncHandler');
const campaignService = require('../services/campaignService');
const ApiError = require('../utils/ApiError'); // Assuming ApiError is in utils/ApiError

exports.createCampaign = asyncHandler(async (req, res, next) => {
  // TODO: Implement validation for campaign creation data
  if (!req.body.name || !req.body.goal) {
    return next(new ApiError('Campaign name and goal are required', 400));
  }
  const campaign = await campaignService.createCampaign(req.body);
  res.status(201).json({ success: true, data: campaign });
});

exports.getCampaignDetails = asyncHandler(async (req, res, next) => {
  const campaignId = req.params.id;
  if (!campaignId) {
    return next(new ApiError('Campaign ID is required', 400));
  }
  const campaign = await campaignService.getCampaignDetails(campaignId);
  if (!campaign) {
    return next(new ApiError('Campaign not found', 404));
  }
  res.status(200).json({ success: true, data: campaign });
});

// A route to join a campaign might be useful, e.g., POST /campaigns/:id/join
exports.joinCampaign = asyncHandler(async (req, res, next) => {
  const campaignId = req.params.id;
  // TODO: Ensure req.user is properly populated with authenticated user details
  // Assuming the user joining is a donor and their ID is available in req.user.id
  const donorId = req.user ? req.user.id : null;

  if (!campaignId) {
    return next(new ApiError('Campaign ID is required', 400));
  }
  if (!donorId) {
    // This might also mean authentication is required for this action
    return next(new ApiError('User not authenticated or donor ID not found', 401));
  }

  const updatedCampaign = await campaignService.addParticipantToCampaign(campaignId, donorId);

  if (!updatedCampaign) {
    // This could mean the campaign was not found or the user is already a participant
    // The service layer should ideally handle the distinction and return appropriate errors
    // For now, assuming a general 'failed to join' if service returns null/undefined
    return next(new ApiError('Failed to join campaign', 500));
  }
  res.status(200).json({ success: true, data: updatedCampaign });
});

// TODO: Add more controller functions as needed, e.g.,
// - updateCampaign
// - deleteCampaign
// - listCampaigns (with filtering/pagination)
// - addDonationToCampaign
// - removeParticipantFromCampaign