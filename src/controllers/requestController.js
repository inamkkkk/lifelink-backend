const asyncHandler = require('../utils/asyncHandler');
const requestService = require('../services/requestService');
const userService = require('../services/userService'); // Import for user role checking

exports.createRequest = asyncHandler(async (req, res, next) => {
  // Recipient ID comes from authenticated user
  const recipientId = req.user.id;

  // TODO: Add validation for request body fields
  // if (!req.body.bloodGroup || !req.body.urgency || !req.body.hospitalId) {
  //   return res.status(400).json({ success: false, message: 'Missing required request fields' });
  // }

  const request = await requestService.createRequest(recipientId, req.body);
  res.status(201).json({ success: true, data: request });
});

exports.getRequestDetails = asyncHandler(async (req, res, next) => {
  const requestId = req.params.id;
  const requestingUserId = req.user.id;
  const requestingUserRole = req.user.role; // Assuming user object has a 'role' property

  const request = await requestService.getRequestDetails(requestId);

  // TODO: Add authorization to ensure only recipient, hospital admin, or system admin can view
  // 1. Check if the requesting user is the recipient
  if (request && request.recipientId === requestingUserId) {
    return res.status(200).json({ success: true, data: request });
  }

  // 2. Check if the requesting user is a hospital admin and has access to this request's hospital
  // This might require fetching the hospital associated with the request and checking the user's hospital affiliation.
  // For now, a simplified check if user role is 'hospital_admin' and the request has a hospital ID.
  if (requestingUserRole === 'hospital_admin' && request.hospitalId) {
    // In a real scenario, you'd check if this hospital_admin is authorized for THIS hospitalId
    // For example: const isAuthorizedHospitalAdmin = await userService.isHospitalAdminForHospital(requestingUserId, request.hospitalId);
    // if (isAuthorizedHospitalAdmin) { ... }
    return res.status(200).json({ success: true, data: request });
  }

  // 3. Check if the requesting user is a system admin
  if (requestingUserRole === 'system_admin') {
    return res.status(200).json({ success: true, data: request });
  }

  // If none of the above conditions are met, deny access
  return res.status(403).json({ success: false, message: 'Unauthorized to view this request details' });
});

exports.matchDonors = asyncHandler(async (req, res, next) => {
  const requestId = req.params.id;
  const requestingUserId = req.user.id;
  const requestingUserRole = req.user.role;

  // TODO: Add authorization checks for who can initiate donor matching.
  // This could be a hospital admin or a system admin.
  if (requestingUserRole !== 'hospital_admin' && requestingUserRole !== 'system_admin') {
    return res.status(403).json({ success: false, message: 'Unauthorized to perform donor matching' });
  }

  const { request, matchedDonors } = await requestService.matchDonors(requestId, requestingUserId);

  res.status(200).json({ success: true, data: request, matchedDonorsCount: matchedDonors.length });
});