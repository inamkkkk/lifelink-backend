const Donation = require('../models/Donation');
const BloodRequest = require('../models/BloodRequest');
const Hospital = require('../models/Hospital');
const User = require('../models/User');
const Campaign = require('../models/Campaign'); // Assuming Campaign model exists
const BloodInventory = require('../models/BloodInventory'); // Assuming BloodInventory model exists
const ErrorResponse = require('../utils/errorResponse');
const mongoose = require('mongoose'); // Import mongoose for aggregation

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

  // Donations by blood type with total quantity
  const donationsByBloodType = await Donation.aggregate([
    { $group: { _id: '$bloodType', count: { $sum: 1 }, totalQuantity: { $sum: '$quantity' } } },
    { $sort: { count: -1 } }
  ]);

  // Donations in the last year
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const recentDonationsCount = await Donation.countDocuments({ appointmentDate: { $gte: oneYearAgo } });

  // Top donors (by count)
  const topDonors = await Donation.aggregate([
    { $group: { _id: '$donorId', donationCount: { $sum: 1 } } },
    { $sort: { donationCount: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users', // Assuming 'users' is the collection name for User model
        localField: '_id',
        foreignField: '_id',
        as: 'donorInfo'
      }
    },
    { $unwind: '$donorInfo' },
    { $project: { _id: 0, donorName: '$donorInfo.name', donationCount: 1 } }
  ]);

  // Average donation quantity
  const avgDonation = await Donation.aggregate([
    { $group: { _id: null, averageQuantity: { $avg: '$quantity' } } }
  ]);
  const averageDonationQuantity = avgDonation.length > 0 ? avgDonation[0].averageQuantity : 0;

  // Geographic distribution of donations (simplified by city, assuming user has city)
  const donationsByCity = await Donation.aggregate([
    {
      $lookup: {
        from: 'users', // Assuming 'users' is the collection name for User model
        localField: 'donorId',
        foreignField: '_id',
        as: 'donorInfo'
      }
    },
    { $unwind: '$donorInfo' },
    {
      $group: { _id: '$donorInfo.address.city', count: { $sum: 1 } }
    },
    { $sort: { count: -1 } }
  ]);


  return {
    totalDonations,
    completedDonations,
    donationsByBloodType,
    recentDonationsCount,
    topDonors,
    averageDonationQuantity,
    donationsByCity,
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
  const cancelledRequests = await BloodRequest.countDocuments({ status: 'cancelled' });

  const requestsByBloodType = await BloodRequest.aggregate([
    { $group: { _id: '$bloodType', count: { $sum: 1 }, totalQuantity: { $sum: '$quantity' } } },
    { $sort: { count: -1 } }
  ]);

  const requestsByUrgency = await BloodRequest.aggregate([
    { $group: { _id: '$urgency', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  // Fulfillment rate
  const totalRequestsForFulfillment = await BloodRequest.countDocuments({ status: { $in: ['fulfilled', 'cancelled'] } });
  const fulfillmentRate = totalRequestsForFulfillment > 0 ? (fulfilledRequests / totalRequestsForFulfillment) * 100 : 0;

  // Average time to fulfill (for fulfilled requests)
  const avgFulfillmentTime = await BloodRequest.aggregate([
    { $match: { status: 'fulfilled', createdAt: { $exists: true }, fulfilledAt: { $exists: true } } },
    {
      $group: {
        _id: null,
        averageTimeInHours: {
          $avg: { $divide: [{ $subtract: ['$fulfilledAt', '$createdAt'] }, 1000 * 60 * 60] }
        }
      }
    }
  ]);
  const averageTimeTofulfill = avgFulfillmentTime.length > 0 ? avgFulfillmentTime[0].averageTimeInHours : 0;

  // Geographic distribution of requests (simplified by hospital city)
  const requestsByHospitalCity = await BloodRequest.aggregate([
    {
      $lookup: {
        from: 'hospitals', // Assuming 'hospitals' is the collection name for Hospital model
        localField: 'hospitalId',
        foreignField: '_id',
        as: 'hospitalInfo'
      }
    },
    { $unwind: '$hospitalInfo' },
    {
      $group: { _id: '$hospitalInfo.address.city', count: { $sum: 1 } }
    },
    { $sort: { count: -1 } }
  ]);


  return {
    totalRequests,
    pendingRequests,
    fulfilledRequests,
    cancelledRequests,
    requestsByBloodType,
    requestsByUrgency,
    fulfillmentRate: fulfillmentRate.toFixed(2),
    averageTimeTofulfill: averageTimeTofulfill.toFixed(2),
    requestsByHospitalCity,
    // TODO: Add more advanced stats
    stub: "Advanced analytics logic pending, showing basic stats."
  };
};

exports.getHospitalStats = async (hospitalId) => {
  if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
    throw new ErrorResponse('Invalid hospital ID', 400);
  }
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

  // Assuming Campaign model and BloodInventory model exist and are imported
  const activeCampaigns = await Campaign.countDocuments({ hospitalId: new mongoose.Types.ObjectId(hospitalId), status: 'ongoing' });

  const inventorySummary = await BloodInventory.aggregate([
    { $match: { hospitalId: new mongoose.Types.ObjectId(hospitalId) } },
    { $group: { _id: '$bloodType', totalQuantity: { $sum: '$quantity' } } }
  ]);

  // Donor engagement specific to this hospital (e.g., unique donors who donated to this hospital)
  const uniqueDonorsToHospital = await Donation.distinct('donorId', { hospitalId: new mongoose.Types.ObjectId(hospitalId) });
  const donorEngagement = {
    uniqueDonors: uniqueDonorsToHospital.length,
    donationsMadeToHospital: donationsReceived
  };


  return {
    hospitalName: hospital.name,
    donationsReceived,
    requestsMade,
    activeCampaigns,
    inventorySummary,
    donorEngagement,
    // TODO: Add more advanced stats specific to hospitals
    stub: "Hospital-specific analytics logic pending, showing basic stats."
  };
};

// TODO: Implement AI-driven insights, prediction models for blood demand, donor retention analytics, etc.