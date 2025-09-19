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
  // For now, we notify the hospital admin who might have initiated the creation.
  if (hospital.admins && hospital.admins.length > 0) {
    await notificationService.sendNotification(
      hospital.admins[0],
      `New campaign '${campaign.title}' created at ${hospital.name}.`,
      'campaign_created', // More specific event type
      { campaignId: campaign._id }
    );
  }

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

exports.updateCampaign = async (campaignId, campaignUpdateData) => {
  let campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    throw new ErrorResponse('Campaign not found', 404);
  }

  // If location is being updated and it's a string, geocode it
  if (campaignUpdateData.location && typeof campaignUpdateData.location === 'string') {
    const geoData = await geocodeAddress(campaignUpdateData.location);
    if (geoData) {
      campaignUpdateData.location = geoData;
    } else {
      throw new ErrorResponse('Could not geocode provided location for campaign update', 400);
    }
  }

  Object.assign(campaign, campaignUpdateData);
  campaign = await campaign.save();

  // TODO: Notify relevant users about the campaign update.
  // This could include participants or potentially donors in the area.
  if (campaign.participants && campaign.participants.length > 0) {
    await notificationService.sendNotification(
      campaign.participants, // Send to all participants
      `Campaign '${campaign.title}' has been updated.`,
      'campaign_updated',
      { campaignId: campaign._id }
    );
  }

  return campaign;
};

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
    'campaign_joined',
    { campaignId: campaign._id }
  );

  // TODO: Notify campaign creator/hospital admin about new participant
  if (campaign.hospitalId && campaign.hospitalId.admins && campaign.hospitalId.admins.length > 0) {
    // Assuming hospitalId is populated or we can fetch hospital details again
    const hospital = await Hospital.findById(campaign.hospitalId);
    if (hospital && hospital.admins && hospital.admins.length > 0) {
      await notificationService.sendNotification(
        hospital.admins[0],
        `New participant joined '${campaign.title}'.`,
        'new_participant',
        { campaignId: campaign._id, participantId: donorId }
      );
    }
  }


  return campaign;
};

exports.removeParticipantFromCampaign = async (campaignId, donorId) => {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    throw new ErrorResponse('Campaign not found', 404);
  }

  const participantIndex = campaign.participants.indexOf(donorId);
  if (participantIndex === -1) {
    throw new ErrorResponse('Donor not found in this campaign', 404);
  }

  campaign.participants.splice(participantIndex, 1);
  await campaign.save();

  await notificationService.sendNotification(
    donorId,
    `You have been removed from the campaign: '${campaign.title}'.`,
    'campaign_removed',
    { campaignId: campaign._id }
  );

  return campaign;
};


exports.checkCampaignStatus = async (campaignId) => {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    throw new ErrorResponse('Campaign not found', 404);
  }

  // TODO: Implement logic to determine campaign status based on its data
  // (e.g., active, completed, expired, cancelled).
  // This might involve checking dates, participant counts, or explicit status flags.

  let status = 'unknown';
  const now = new Date();

  if (campaign.endDate && now > new Date(campaign.endDate)) {
    status = 'expired';
  } else if (campaign.startDate && now < new Date(campaign.startDate)) {
    status = 'scheduled';
  } else if (campaign.status === 'active') { // Assuming a 'status' field in the model
    status = 'active';
  } else if (campaign.status === 'completed') {
    status = 'completed';
  } else if (campaign.status === 'cancelled') {
    status = 'cancelled';
  } else {
    status = 'active'; // Default if no specific status or date checks match
  }

  return { campaignId: campaign._id, title: campaign.title, status };
};