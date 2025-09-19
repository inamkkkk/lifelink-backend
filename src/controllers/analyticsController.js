const asyncHandler = require('../utils/asyncHandler');
const analyticsService = require('../services/analyticsService');

exports.donationStats = asyncHandler(async (req, res, next) => {
  const stats = await analyticsService.getDonationStats();
  res.status(200).json({ success: true, data: stats });
});

exports.requestStats = asyncHandler(async (req, res, next) => {
  const stats = await analyticsService.getRequestStats();
  res.status(200).json({ success: true, data: stats });
});

exports.hospitalStats = asyncHandler(async (req, res, next) => {
  const stats = await analyticsService.getHospitalStats(req.params.id);
  res.status(200).json({ success: true, data: stats });
});

// TODO: For AI-driven analytics, this controller would call a service that interacts with
// a machine learning model or a specialized analytics platform. 
// Example:
// exports.predictBloodDemand = asyncHandler(async (req, res, next) => {
//   // TODO: Implement AI prediction logic.
//   // Steps:
//   // 1. Gather historical data from Donation and BloodRequest models.
//   // 2. Pass data to an external AI service or an in-app prediction model.
//   // 3. Return predictions for blood demand based on trends, campaigns, etc.
//   res.json({ status: "stub", message: "AI-driven blood demand prediction pending" });
// });
