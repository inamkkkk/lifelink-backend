const asyncHandler = require('../utils/asyncHandler');
const hospitalService = require('../services/hospitalService');

/**
 * @TODO: Implement validation for request body.
 * Use a library like express-validator or Joi for robust validation.
 */
exports.registerHospital = asyncHandler(async (req, res, next) => {
  // TODO: Add request body validation here
  // Example:
  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  //   return res.status(400).json({ success: false, errors: errors.array() });
  // }

  const hospital = await hospitalService.registerHospital(req.body);
  res.status(201).json({ success: true, data: hospital });
});

exports.getHospitalDetails = asyncHandler(async (req, res, next) => {
  const {
    id
  } = req.params; // Destructure id for clarity

  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'Hospital ID is required'
    });
  }

  const hospital = await hospitalService.getHospitalDetails(id);

  if (!hospital) {
    return res.status(404).json({
      success: false,
      message: 'Hospital not found'
    });
  }

  res.status(200).json({
    success: true,
    data: hospital
  });
});

/**
 * @TODO: Implement a controller function to update hospital details.
 * This function should accept an ID in the URL params and updated data in the request body.
 * It should call a corresponding service method and return the updated hospital data.
 * It should also handle cases where the hospital is not found or validation errors occur.
 */

/**
 * @TODO: Implement a controller function to delete a hospital.
 * This function should accept an ID in the URL params.
 * It should call a corresponding service method to delete the hospital.
 * It should return a success message upon successful deletion or an appropriate error message if the hospital is not found.
 */