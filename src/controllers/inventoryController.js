const asyncHandler = require('../utils/asyncHandler');
const inventoryService = require('../services/inventoryService');
const ErrorResponse = require('../utils/ErrorResponse'); // Assuming ErrorResponse is in a utils directory

exports.getHospitalInventory = asyncHandler(async (req, res, next) => {
  // Authorization: Only hospital admins for that hospital or system admin can view
  // Ensure that req.user.hospitalId is a string or convert it to string for comparison
  if (req.user.role === 'hospital_admin' && String(req.user.hospitalId) !== req.params.hospitalId) {
    return next(new ErrorResponse('Not authorized to view this hospital inventory', 403));
  }
  const inventory = await inventoryService.getHospitalInventory(req.params.hospitalId);
  res.status(200).json({ success: true, data: inventory });
});

exports.updateInventory = asyncHandler(async (req, res, next) => {
  // Authorization: Only hospital admins for that hospital or system admin can update
  // Ensure that req.user.hospitalId is a string or convert it to string for comparison
  if (req.user.role === 'hospital_admin' && String(req.user.hospitalId) !== req.params.hospitalId) {
    return next(new ErrorResponse('Not authorized to update this hospital inventory', 403));
  }

  const { bloodType } = req.body; // BloodType is also needed for finding the specific inventory item

  // TODO: Add validation for bloodType and other fields in req.body
  if (!bloodType) {
    return next(new ErrorResponse('Blood type is required for updating inventory', 400));
  }

  const inventoryItem = await inventoryService.updateInventory(req.params.hospitalId, bloodType, req.body);

  // TODO: Handle cases where inventoryItem is not found or update fails
  if (!inventoryItem) {
    return next(new ErrorResponse('Inventory item not found or update failed', 404));
  }

  res.status(200).json({ success: true, data: inventoryItem });
});