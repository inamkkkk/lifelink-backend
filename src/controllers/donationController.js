const asyncHandler = require('../utils/asyncHandler');
const donationService = require('../services/donationService');
const APIError = require('../utils/APIError');
const { ROLES } = require('../constants/userRoles');

exports.scheduleDonation = asyncHandler(async (req, res, next) => {
  // Donor ID comes from authenticated user
  const donorId = req.user.id;
  if (!donorId) {
    return next(new APIError("User not authenticated", 401));
  }
  const donation = await donationService.scheduleDonation(donorId, req.body);
  res.status(201).json({ success: true, data: donation });
});

exports.getDonationDetails = asyncHandler(async (req, res, next) => {
  const donationId = req.params.id;
  if (!donationId) {
    return next(new APIError("Donation ID is required", 400));
  }

  const donation = await donationService.getDonationDetails(donationId);

  if (!donation) {
    return next(new APIError("Donation not found", 404));
  }

  // TODO: Add authorization to ensure only donor, hospital admin, or system admin can view
  const userId = req.user.id;
  const userRole = req.user.role;

  // Check if the logged-in user is the donor
  if (donation.donor && donation.donor.toString() === userId) {
    return res.status(200).json({ success: true, data: donation });
  }

  // Check if the logged-in user is a hospital admin and associated with the donation
  // This assumes donation has a hospital field and hospital has an admin field or similar
  if (userRole === ROLES.HOSPITAL_ADMIN) {
    // You might need to adjust this logic based on how donations are linked to hospitals and admins
    // For example, if a donation has a 'hospital' field that contains the hospital's ID,
    // and the user's role check needs to be more specific.
    // This is a placeholder assuming direct association check.
    // Example: if (donation.hospital && donation.hospital.admin.toString() === userId) { ... }
    // For now, we'll allow hospital admins to view any donation. Refine this in actual implementation.
    return res.status(200).json({ success: true, data: donation });
  }

  // Check if the logged-in user is a system admin
  if (userRole === ROLES.SYSTEM_ADMIN) {
    return res.status(200).json({ success: true, data: donation });
  }

  // If none of the above, the user is not authorized
  return next(new APIError("Unauthorized to view this donation", 403));
});

exports.cancelDonation = asyncHandler(async (req, res, next) => {
  const donationId = req.params.id;
  const userId = req.user.id;
  const userRole = req.user.role;

  if (!donationId) {
    return next(new APIError("Donation ID is required", 400));
  }
  if (!userId) {
    return next(new APIError("User not authenticated", 401));
  }

  const cancelledDonation = await donationService.cancelDonation(donationId, userId, userRole);

  if (!cancelledDonation) {
    // This case might happen if the donation is not found, or if the user is not authorized to cancel
    // The service layer should ideally handle the specific reasons and return appropriate errors
    return next(new APIError("Failed to cancel donation. It might not exist or you are not authorized.", 400));
  }

  res.status(200).json({ success: true, data: cancelledDonation });
});