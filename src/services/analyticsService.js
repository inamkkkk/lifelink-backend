const Donation = require('../models/Donation');
const BloodRequest = require('../models/BloodRequest');
const Hospital = require('../models/Hospital');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

exports.getDonationStats = async () => {
  // TODO: Implement detailed donation statistics.
  // Steps:
  // 1. Total donations over time (e.g., monthly, quarterly).
  // 2. Donations by blood type.
  // 3. Donations by status (scheduled, completed, cancelled).
  // 4. Top donors (most donations).
  // 5. Average donation quantity.
  // 6. Geographic distribution of donations.

  const totalDonations = await Donation.countDocuments({});
  const completedDonations = await Donation.countDocuments({ status: 'completed' });
  const donationsByBloodType = await Donation.aggregate([
    { $group: { _id: '$bloodType', count: { $sum: 1 }, totalQuantity: { $sum: '$quantity' } } },
    { $sort: { count: -1 } }
  ]);
  const recentDonations = await Donation.find({ appointmentDate: { $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) } }).countDocuments();

  return {
    totalDonations,
    completedDonations,
    donationsByBloodType,
    recentDonations: recentDonations || 0,
    // TODO: Add more advanced stats
    stub: "Advanced analytics logic pending, showing basic stats."
  };
};

exports.getRequestStats = async () => {
  // TODO: Implement detailed blood request statistics.
  // Steps:
  // 1. Total requests over time.
  // 2. Requests by blood type.
  // 3. Requests by urgency level.
  // 4. Fulfillment rate (matched vs. fulfilled).
  // 5. Geographic distribution of requests.
  // 6. Average time to fulfill a request.

  const totalRequests = await BloodRequest.countDocuments({});
  const pendingRequests = await BloodRequest.countDocuments({ status: 'pending' });
  const fulfilledRequests = await BloodRequest.countDocuments({ status: 'fulfilled' });
  const requestsByBloodType = await BloodRequest.aggregate([
    { $group: { _id: '$bloodType', count: { $sum: 1 }, totalQuantity: { $sum: '$quantity' } } },
    { $sort: { count: -1 } }
  ]);
  const requestsByUrgency = await BloodRequest.aggregate([
    { $group: { _id: '$urgency', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  return {
    totalRequests,
    pendingRequests,
    fulfilledRequests,
    requestsByBloodType,
    requestsByUrgency,
    // TODO: Add more advanced stats
    stub: "Advanced analytics logic pending, showing basic stats."
  };
};

exports.getHospitalStats = async (hospitalId) => {
  const hospital = await Hospital.findById(hospitalId);
  if (!hospital) {
    throw new ErrorResponse('Hospital not found', 404);
  }

  // TODO: Implement hospital-specific analytics.
  // Steps:
  // 1. Number of donations received by the hospital.
  // 2. Number of blood requests initiated by the hospital.
  // 3. Current blood inventory levels.
  // 4. Campaigns organized by the hospital.
  // 5. Donor engagement specific to this hospital.

  const donationsReceived = await Donation.countDocuments({ hospitalId });
  const requestsMade = await BloodRequest.countDocuments({ hospitalId });
  const activeCampaigns = await Campaign.countDocuments({ hospitalId, status: 'ongoing' });
  const inventorySummary = await BloodInventory.aggregate([
    { $match: { hospitalId: hospital._id } },
    { $group: { _id: '$bloodType', totalQuantity: { $sum: '$quantity' } } }
  ]);

  return {
    hospitalName: hospital.name,
    donationsReceived,
    requestsMade,
    activeCampaigns,
    inventorySummary,
    // TODO: Add more advanced stats specific to hospitals
    stub: "Hospital-specific analytics logic pending, showing basic stats."
  };
};

// TODO: Implement AI-driven insights, prediction models for blood demand, donor retention analytics, etc.
