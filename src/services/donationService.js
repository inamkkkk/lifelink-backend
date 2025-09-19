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

  // Ensure appointmentDate is a Date object if it's coming as a string
  if (typeof donationData.appointmentDate === 'string') {
    donationData.appointmentDate = new Date(donationData.appointmentDate);
  }

  const donation = await Donation.create({
    donorId,
    ...donationData,
    status: 'scheduled',
  });

  // TODO: Send notification to hospital admins about new scheduled donation
  // Assuming hospital.admins is an array of user IDs. Need to fetch user details for names.
  if (hospital.admins && hospital.admins.length > 0) {
    const adminUser = await User.findById(hospital.admins[0]);
    if (adminUser) {
      await notificationService.sendNotification(
        adminUser._id, // Send to admin's ID
        `New donation scheduled by ${donor.fullName} (${donor.bloodType}) for ${donationData.appointmentDate.toDateString()} at your hospital.`,
        'system'
      );
    }
  }

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
  const donor = await User.findById(donation.donorId);
  if (donor) {
    await notificationService.sendNotification(
      donor._id,
      `Your donation scheduled for ${donation.appointmentDate.toDateString()} has been cancelled.`,
      'alert'
    );
  }

  // Notify hospital admins
  const hospital = await Hospital.findById(donation.hospitalId);
  if (hospital && hospital.admins && hospital.admins.length > 0) {
    const adminUser = await User.findById(hospital.admins[0]);
    if (adminUser) {
      await notificationService.sendNotification(
        adminUser._id,
        `Donation scheduled by ${donor ? donor.fullName : 'a donor'} on ${donation.appointmentDate.toDateString()} has been cancelled.`,
        'alert'
      );
    }
  }

  return donation;
};

// TODO: Implement functions for updating donation status (e.g., 'completed', 'in_progress')
exports.updateDonationStatus = async (donationId, newStatus, userId, role) => {
  const donation = await Donation.findById(donationId);

  if (!donation) {
    throw new ErrorResponse('Donation not found', 404);
  }

  // Authorization: Only the donor, hospital admins, or system admins can update status
  if (donation.donorId.toString() !== userId.toString() && role !== 'system_admin') {
    const hospital = await Hospital.findById(donation.hospitalId);
    if (!hospital || !hospital.admins.includes(userId)) {
      throw new ErrorResponse('Not authorized to update donation status', 403);
    }
  }

  const allowedStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
  if (!allowedStatuses.includes(newStatus)) {
    throw new ErrorResponse('Invalid status provided', 400);
  }

  if (donation.status === newStatus) {
    return donation; // No change needed
  }

  // Prevent status changes that don't make sense chronologically
  const statusOrder = ['scheduled', 'in_progress', 'completed', 'cancelled'];
  const currentStatusIndex = statusOrder.indexOf(donation.status);
  const newStatusIndex = statusOrder.indexOf(newStatus);

  if (newStatusIndex < currentStatusIndex) {
    throw new ErrorResponse(`Cannot change status from ${donation.status} to ${newStatus}`, 400);
  }

  donation.status = newStatus;
  // Add logic to record who updated the status and when, potentially in a history field
  await donation.save();

  // TODO: Notify relevant parties about status change
  const donor = await User.findById(donation.donorId);
  const hospital = await Hospital.findById(donation.hospitalId);

  if (donor) {
    await notificationService.sendNotification(
      donor._id,
      `Your donation status has been updated to: ${newStatus}.`,
      'info'
    );
  }

  if (hospital && hospital.admins && hospital.admins.length > 0) {
    const adminUser = await User.findById(hospital.admins[0]);
    if (adminUser) {
      await notificationService.sendNotification(
        adminUser._id,
        `Donation status updated to: ${newStatus}.`,
        'info'
      );
    }
  }

  return donation;
};