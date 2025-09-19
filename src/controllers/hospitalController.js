const asyncHandler = require('../utils/asyncHandler');
const hospitalService = require('../services/hospitalService');

exports.registerHospital = asyncHandler(async (req, res, next) => {
  const hospital = await hospitalService.registerHospital(req.body);
  res.status(201).json({ success: true, data: hospital });
});

exports.getHospitalDetails = asyncHandler(async (req, res, next) => {
  const hospital = await hospitalService.getHospitalDetails(req.params.id);
  res.status(200).json({ success: true, data: hospital });
});
