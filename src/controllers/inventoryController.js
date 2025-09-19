const asyncHandler = require('../utils/asyncHandler');
const inventoryService = require('../services/inventoryService');

exports.getHospitalInventory = asyncHandler(async (req, res, next) => {
  // Authorization: Only hospital admins for that hospital or system admin can view
  if (req.user.role === 'hospital_admin' && req.user.hospitalId.toString() !== req.params.hospitalId) {
    // Assuming req.user.hospitalId is set during auth for hospital admins
    return next(new ErrorResponse('Not authorized to view this hospital inventory', 403));
  }
  const inventory = await inventoryService.getHospitalInventory(req.params.hospitalId);
  res.status(200).json({ success: true, data: inventory });
});

exports.updateInventory = asyncHandler(async (req, res, next) => {
  // Authorization: Only hospital admins for that hospital or system admin can update
  if (req.user.role === 'hospital_admin' && req.user.hospitalId.toString() !== req.params.hospitalId) {
    return next(new ErrorResponse('Not authorized to update this hospital inventory', 403));
  }
  const { bloodType } = req.body; // BloodType is also needed for finding the specific inventory item
  const inventoryItem = await inventoryService.updateInventory(req.params.hospitalId, bloodType, req.body);
  res.status(200).json({ success: true, data: inventoryItem });
});
