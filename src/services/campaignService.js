const Campaign = require('../models/Campaign');
const Hospital = require('../models/Hospital');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const { geocodeAddress } = require('../utils/geoUtils');
const notificationService = require('./notificationService');

exports.createCampaign = async (campaignData) => {
  const hospital = await Hospital.findById(campaignData.hospitalId);
  if (!hospital) {
    throw new ErrorResponse('Hospital not found', 404);
  }

  if (campaignData.location && typeof campaignData.location === 'string') {
    const geoData = await geocodeAddress(campaignData.location);
    if (geoData) {
      campaignData.location = geoData;
    } else {
      throw new ErrorResponse('Could not geocode provided location for campaign', 400);
    }
  }

  const campaign = await Campaign.create(campaignData);

  // TODO: Notify relevant users (e.g., donors in the area) about the new campaign
  // This would involve a more complex geographic query on User models.
  notificationService.sendNotification(
    hospital.admins[0], // Notify the hospital admin who created it
    `New campaign '${campaign.title}' created by your hospital.`,
    'campaign'
  );

  return campaign;
};

exports.getCampaignDetails = async (campaignId) => {
  const campaign = await Campaign.findById(campaignId)
    .populate('hospitalId', 'name address')
    .populate('participants', 'fullName email');

  if (!campaign) {
    throw new ErrorResponse('Campaign not found', 404);
  }
  return campaign;
};

// TODO: Implement functions for updating campaign, adding participants, checking status updates.
exports.addParticipantToCampaign = async (campaignId, donorId) => {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    throw new ErrorResponse('Campaign not found', 404);
  }

  const donor = await User.findById(donorId);
  if (!donor || donor.role !== 'donor') {
    throw new ErrorResponse('Donor not found or invalid user role', 404);
  }

  if (campaign.participants.includes(donorId)) {
    throw new ErrorResponse('Donor already participating in this campaign', 400);
  }

  campaign.participants.push(donorId);
  await campaign.save();

  await notificationService.sendNotification(
    donorId,
    `You have successfully joined the campaign: '${campaign.title}'.`,
    'campaign'
  );

  return campaign;
};
