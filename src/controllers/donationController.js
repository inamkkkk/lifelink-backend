const asyncHandler = require('../utils/asyncHandler');
const donationService = require('../services/donationService');

exports.scheduleDonation = asyncHandler(async (req, res, next) => {
  // Donor ID comes from authenticated user
  const donorId = req.user.id;
  const donation = await donationService.scheduleDonation(donorId, req.body);
  res.status(201).json({ success: true, data: donation });
});

exports.getDonationDetails = asyncHandler(async (req, res, next) => {
  const donation = await donationService.getDonationDetails(req.params.id);
  // TODO: Add authorization to ensure only donor, hospital admin, or system admin can view
  res.status(200).json({ success: true, data: donation });
});

exports.cancelDonation = asyncHandler(async (req, res, next) => {
  const cancelledDonation = await donationService.cancelDonation(req.params.id, req.user.id, req.user.role);
  res.status(200).json({ success: true, data: cancelledDonation });
});
