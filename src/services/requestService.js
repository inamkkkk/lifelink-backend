const BloodRequest = require('../models/BloodRequest');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const notificationService = require('./notificationService');
const ErrorResponse = require('../utils/errorResponse');

exports.createRequest = async (recipientId, requestData) => {
  const recipient = await User.findById(recipientId);
  if (!recipient) {
    throw new ErrorResponse('Recipient not found', 404);
  }

  const hospital = await Hospital.findById(requestData.hospitalId);
  if (!hospital) {
    throw new ErrorResponse('Hospital not found', 404);
  }

  const request = await BloodRequest.create({
    recipientId,
    ...requestData,
    status: 'pending',
  });

  // TODO: Notify hospital admins about new blood request
  await notificationService.sendNotification(
    hospital.admins[0], // Assuming first admin for now
    `New blood request for ${requestData.bloodType} (${requestData.quantity}ml) with ${requestData.urgency} urgency from ${recipient.fullName} at your hospital.`,
    'system'
  );

  return request;
};

exports.getRequestDetails = async (requestId) => {
  const request = await BloodRequest.findById(requestId)
    .populate('recipientId', 'fullName email phone bloodType')
    .populate('hospitalId', 'name address contactEmail')
    .populate('matchedDonorIds', 'fullName email phone bloodType location');

  if (!request) {
    throw new ErrorResponse('Blood request not found', 404);
  }
  return request;
};

exports.matchDonors = async (requestId, userId) => {
  const request = await BloodRequest.findById(requestId);

  if (!request) {
    throw new ErrorResponse('Blood request not found', 404);
  }

  // Authorization: Only the requesting hospital's admin or system admin can trigger matching
  const hospital = await Hospital.findById(request.hospitalId);
  if (!hospital || (!hospital.admins.includes(userId) && userId.toString() !== request.recipientId.toString())) { // Allowing recipient to check matches
    throw new ErrorResponse('Not authorized to match donors for this request', 403);
  }

  // TODO: Implement advanced AI-driven geolocation + blood type matching logic.
  // Steps:
  // 1. Find eligible donors based on: bloodType, donationEligibility (true),
  //    lastDonationDate (e.g., not donated in the last 56 days).
  // 2. Filter donors by proximity to the requesting hospital's location (using GeoJSON $near query).
  // 3. Consider urgency: for 'critical', expand search radius and ignore `lastDonationDate` if necessary.
  // 4. Implement a ranking system for donors (e.g., proximity, frequency of donations).
  // 5. Select a suitable number of top donors.
  // 6. Update the BloodRequest with matchedDonorIds.
  // 7. Send notifications to matched donors (and potentially the requesting hospital/recipient).
  //    This might require a separate 'potential_match' notification type.
  // 8. Handle cases where no donors are found.

  // Placeholder for matching logic
  const matchedDonors = await User.find({
    bloodType: request.bloodType,
    donationEligibility: true,
    lastDonationDate: { $lte: new Date(new Date().setMonth(new Date().getMonth() - 2)) }, // Donated more than 2 months ago
    // Add geospatial query here based on hospital.location
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: hospital.location.coordinates // Assuming hospital has location
        },
        $maxDistance: 50000 // 50 km radius (example)
      }
    }
  }).limit(10).select('fullName email phone bloodType location'); // Limit to top 10 potential donors

  request.matchedDonorIds = matchedDonors.map(donor => donor._id);
  request.status = matchedDonors.length > 0 ? 'matched' : 'pending'; // Change status if matches found
  await request.save();

  // TODO: Send notifications to matched donors
  for (const donor of matchedDonors) {
    await notificationService.sendNotification(
      donor._id,
      `You have been matched for a blood donation request at ${hospital.name} for blood type ${request.bloodType}. Please check the app for details.`,
      'request_match'
    );
  }

  return { request, matchedDonors };
};

// TODO: Implement functionality to mark request as fulfilled/cancelled, manage matched donors, etc.
