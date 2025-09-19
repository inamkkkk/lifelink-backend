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
  // Refined notification logic: Ensure hospital has admins before sending.
  if (hospital.admins && hospital.admins.length > 0) {
    await notificationService.sendNotification(
      hospital.admins[0], // Assuming first admin for now
      `New blood request for ${requestData.bloodType} (${requestData.quantity}ml) with ${requestData.urgency} urgency from ${recipient.fullName} at your hospital.`,
      'new_request' // Changed notification type for clarity
    );
  }

  return request;
};

exports.getRequestDetails = async (requestId) => {
  const request = await BloodRequest.findById(requestId)
    .populate('recipientId', 'fullName email phone bloodType')
    .populate('hospitalId', 'name address contactEmail location') // Include location for matching
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

  // Authorization: Only the requesting hospital's admin or system admin can trigger matching.
  // The recipient should not be able to trigger matching directly, but can view matches.
  const hospital = await Hospital.findById(request.hospitalId);
  if (!hospital || !hospital.admins.includes(userId)) {
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

  // --- Implementation of TODO ---

  const now = new Date();
  const fiftySixDaysAgo = new Date(now.setDate(now.getDate() - 56)); // Standard donation interval

  // Base donor eligibility criteria
  const donorQuery = {
    bloodType: request.bloodType,
    donationEligibility: true,
    lastDonationDate: { $lte: fiftySixDaysAgo },
    'location.coordinates': {
      $geoWithin: {
        $centerSphere: [
          hospital.location.coordinates, // [lng, lat]
          // Calculate radius in radians: 50km / Earth's radius (approx 6371 km)
          50 / 6371
        ]
      }
    }
  };

  // Adjustments for urgency
  if (request.urgency === 'critical') {
    // For critical urgency, we might search a wider area and potentially relax lastDonationDate
    // For simplicity, we'll expand the radius and maintain lastDonationDate for now.
    donorQuery['location.coordinates'].$geoWithin.$centerSphere[1] = 100 / 6371; // e.g., 100 km radius
    // Optionally, relax last donation date:
    // donorQuery.lastDonationDate = { $lte: new Date(now.setDate(now.getDate() - 28)) }; // e.g., 28 days ago
  }

  // Fetch potential donors
  let potentialDonors = await User.find(donorQuery)
    .select('fullName email phone bloodType location')
    .limit(20); // Fetch a reasonable number before ranking

  // TODO: Implement a ranking system for donors (e.g., proximity, frequency of donations).
  // For now, we'll sort by proximity. GeoJSON $near can be used for more precise ranking,
  // but $geoWithin is simpler for initial filtering.

  // Simple proximity sorting (assuming location has coordinates)
  potentialDonors.sort((a, b) => {
    if (!a.location || !b.location || !a.location.coordinates || !b.location.coordinates) {
      return 0; // Cannot sort if location is missing
    }
    const distA = Math.sqrt(
      Math.pow(a.location.coordinates[0] - hospital.location.coordinates[0], 2) +
      Math.pow(a.location.coordinates[1] - hospital.location.coordinates[1], 2)
    );
    const distB = Math.sqrt(
      Math.pow(b.location.coordinates[0] - hospital.location.coordinates[0], 2) +
      Math.pow(b.location.coordinates[1] - hospital.location.coordinates[1], 2)
    );
    return distA - distB;
  });

  const matchedDonors = potentialDonors.slice(0, 5); // Select top 5 donors

  // Update the BloodRequest
  request.matchedDonorIds = matchedDonors.map(donor => donor._id);
  request.status = matchedDonors.length > 0 ? 'matched' : 'pending';
  await request.save();

  // Send notifications to matched donors
  for (const donor of matchedDonors) {
    await notificationService.sendNotification(
      donor._id,
      `You have been matched for a blood donation request at ${hospital.name} for blood type ${request.bloodType}. Please check the app for details.`,
      'potential_match' // Changed notification type
    );
  }

  // TODO: Handle cases where no donors are found.
  if (matchedDonors.length === 0) {
    // Optionally send a notification to the hospital/recipient that no donors were found.
    console.log(`No donors found for request ${requestId}`);
    // await notificationService.sendNotification(hospital.admins[0], `No donors found for ${request.bloodType} request.`, 'no_donors_found');
  }

  return { request, matchedDonors };
};

// TODO: Implement functionality to mark request as fulfilled/cancelled, manage matched donors, etc.
exports.updateRequestStatus = async (requestId, status, userId) => {
  const request = await BloodRequest.findById(requestId);
  if (!request) {
    throw new ErrorResponse('Blood request not found', 404);
  }

  // Authorization check: Only hospital admins or recipient can update status.
  const hospital = await Hospital.findById(request.hospitalId);
  if (!hospital || (!hospital.admins.includes(userId) && userId.toString() !== request.recipientId.toString())) {
    throw new ErrorResponse('Not authorized to update request status', 403);
  }

  // Validate status transitions if needed
  const validStatuses = ['pending', 'matched', 'fulfilled', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new ErrorResponse('Invalid status provided', 400);
  }

  request.status = status;
  await request.save();

  // Optional: Send notifications about status change
  if (status === 'fulfilled') {
    // Notify recipient and hospital admins
    await notificationService.sendNotification(request.recipientId, `Your blood request has been fulfilled!`, 'request_fulfilled');
    if (hospital.admins && hospital.admins.length > 0) {
      await notificationService.sendNotification(hospital.admins[0], `Blood request ${requestId} has been fulfilled.`, 'request_fulfilled_admin');
    }
    // Notify matched donors that the request is no longer active
    for (const donorId of request.matchedDonorIds) {
      await notificationService.sendNotification(donorId, `A blood donation request you were matched with has been fulfilled.`, 'request_fulfilled_donor');
    }
  } else if (status === 'cancelled') {
    // Notify recipient and hospital admins
    await notificationService.sendNotification(request.recipientId, `Your blood request has been cancelled.`, 'request_cancelled');
    if (hospital.admins && hospital.admins.length > 0) {
      await notificationService.sendNotification(hospital.admins[0], `Blood request ${requestId} has been cancelled.`, 'request_cancelled_admin');
    }
    // Notify matched donors that the request is no longer active
    for (const donorId of request.matchedDonorIds) {
      await notificationService.sendNotification(donorId, `A blood donation request you were matched with has been cancelled.`, 'request_cancelled_donor');
    }
  }

  return request;
};

exports.viewMyRequests = async (userId, role = 'recipient') => {
  let query = {};
  if (role === 'recipient') {
    query = { recipientId: userId };
  } else if (role === 'hospital_admin') {
    // Find hospitals the user is an admin for, then find requests at those hospitals
    const hospitals = await Hospital.find({ admins: userId });
    const hospitalIds = hospitals.map(h => h._id);
    query = { hospitalId: { $in: hospitalIds } };
  } else if (role === 'donor') {
    // View requests a user is matched with
    query = { matchedDonorIds: userId };
  } else {
    throw new ErrorResponse('Invalid role specified', 400);
  }

  const requests = await BloodRequest.find(query)
    .populate('recipientId', 'fullName')
    .populate('hospitalId', 'name');

  return requests;
};