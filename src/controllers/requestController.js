const asyncHandler = require('../utils/asyncHandler');
const requestService = require('../services/requestService');

exports.createRequest = asyncHandler(async (req, res, next) => {
  // Recipient ID comes from authenticated user
  const recipientId = req.user.id;
  const request = await requestService.createRequest(recipientId, req.body);
  res.status(201).json({ success: true, data: request });
});

exports.getRequestDetails = asyncHandler(async (req, res, next) => {
  const request = await requestService.getRequestDetails(req.params.id);
  // TODO: Add authorization to ensure only recipient, hospital admin, or system admin can view
  res.status(200).json({ success: true, data: request });
});

exports.matchDonors = asyncHandler(async (req, res, next) => {
  // This could be called by a hospital_admin or system_admin
  const { request, matchedDonors } = await requestService.matchDonors(req.params.id, req.user.id);
  res.status(200).json({ success: true, data: request, matchedDonorsCount: matchedDonors.length });
});
