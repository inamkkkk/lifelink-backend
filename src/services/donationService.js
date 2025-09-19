const Donation = require('../models/Donation');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const ErrorResponse = require('../utils/errorResponse');
const notificationService = require('./notificationService');

exports.scheduleDonation = async (donorId, donationData) => {
  const donor = await User.findById(donorId);
  if (!donor) {
    throw new ErrorResponse('Donor not found', 404);
  }

  const hospital = await Hospital.findById(donationData.hospitalId);
  if (!hospital) {
    throw new ErrorResponse('Hospital not found', 404);
  }

  // Check donor eligibility (basic check, more complex logic in a dedicated eligibility service)
  if (!donor.donationEligibility) {
    throw new ErrorResponse('Donor is not eligible for donation at this time', 403);
  }

  const donation = await Donation.create({
    donorId,
    ...donationData,
    status: 'scheduled',
  });

  // TODO: Send notification to hospital admins about new scheduled donation
  await notificationService.sendNotification(
    hospital.admins[0], // Assuming first admin for now
    `New donation scheduled by ${donor.fullName} (${donor.bloodType}) for ${donationData.appointmentDate.toDateString()} at your hospital.`,
    'system'
  );

  return donation;
};

exports.getDonationDetails = async (donationId) => {
  const donation = await Donation.findById(donationId)
    .populate('donorId', 'fullName email phone bloodType')
    .populate('hospitalId', 'name address contactEmail');

  if (!donation) {
    throw new ErrorResponse('Donation not found', 404);
  }
  return donation;
};

exports.cancelDonation = async (donationId, userId, role) => {
  const donation = await Donation.findById(donationId);

  if (!donation) {
    throw new ErrorResponse('Donation not found', 404);
  }

  // Authorization: Only the donor or a hospital admin (if associated with the hospital) or system admin can cancel
  if (donation.donorId.toString() !== userId.toString() && role !== 'system_admin') {
    // Check if user is an admin of the hospital where donation is scheduled
    const hospital = await Hospital.findById(donation.hospitalId);
    if (!hospital || !hospital.admins.includes(userId)) {
      throw new ErrorResponse('Not authorized to cancel this donation', 403);
    }
  }

  if (['completed', 'cancelled'].includes(donation.status)) {
    throw new ErrorResponse(`Donation is already ${donation.status}`, 400);
  }

  donation.status = 'cancelled';
  // donation.notes = cancellationReason; // If we add a reason field
  await donation.save();

  // TODO: Notify donor and hospital about cancellation
  await notificationService.sendNotification(
    donation.donorId,
    `Your donation scheduled for ${donation.appointmentDate.toDateString()} has been cancelled.`,
    'alert'
  );

  return donation;
};

// TODO: Implement functions for updating donation status (e.g., 'completed', 'in_progress')
