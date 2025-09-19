const Joi = require('joi');
const ErrorResponse = require('../utils/errorResponse');

/**
 * Middleware to validate request data using Joi schemas.
 * @param {Joi.Schema} schema - The Joi schema to validate against.
 * @param {string} property - The property of the request object to validate (e.g., 'body', 'params', 'query').
 */
const validate = (schema, property = 'body') => (req, res, next) => {
  // TODO: Handle potential errors if req[property] is undefined or not an object before calling validate.
  if (!req[property] || typeof req[property] !== 'object') {
    return next(new ErrorResponse('Request property to validate is missing or invalid.', 400));
  }

  const { error } = schema.validate(req[property], { abortEarly: false });
  if (error) {
    // TODO: Format Joi error messages for better user feedback.
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return next(new ErrorResponse(`Validation Error: ${errorMessage}`, 400));
  }
  next();
};

// --- Joi Schemas for each feature ---

exports.registerUserSchema = Joi.object({
  fullName: Joi.string().trim().required(),
  email: Joi.string().email().required().messages({ 'string.email': 'Email must be a valid email address' }),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('donor', 'recipient', 'hospital_admin', 'system_admin').default('donor'),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required().messages({ 'string.pattern.base': 'Phone number must be a valid E.164 format' }),
  location: Joi.object({
    type: Joi.string().valid('Point').required(),
    coordinates: Joi.array().items(Joi.number()).length(2).required(),
    properties: Joi.object({
      city: Joi.string(),
      country: Joi.string(),
      address: Joi.string()
    }).unknown(true)
  }).required(),
  bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-').required(),
  medicalHistory: Joi.array().items(Joi.string().allow('')).optional(), // Allow empty strings for conditions
  lastDonationDate: Joi.date().iso().allow(null).optional()
});

exports.loginUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

exports.updateUserSchema = Joi.object({
  fullName: Joi.string().trim(),
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).messages({ 'string.pattern.base': 'Phone number must be a valid E.164 format' }),
  location: Joi.object({
    type: Joi.string().valid('Point').required(),
    coordinates: Joi.array().items(Joi.number()).length(2).required(),
    properties: Joi.object({
      city: Joi.string(),
      country: Joi.string(),
      address: Joi.string()
    }).unknown(true)
  }),
  bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'),
  medicalHistory: Joi.array().items(Joi.string().allow('')), // Allow empty strings for conditions
  donationEligibility: Joi.boolean(),
  lastDonationDate: Joi.date().iso().allow(null)
}).min(1); // At least one field is required for update

exports.scheduleDonationSchema = Joi.object({
  hospitalId: Joi.string().hex().length(24).required(),
  bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-').required(),
  appointmentDate: Joi.date().min('now').required(),
  quantity: Joi.number().integer().min(100).max(5000).required(), // Sensible limits for donation quantity
  notes: Joi.string().allow('').max(500)
});

exports.cancelDonationSchema = Joi.object({
  status: Joi.string().valid('cancelled').required(),
  notes: Joi.string().allow('').max(500) // Optional reason for cancellation
});

exports.createRequestSchema = Joi.object({
  hospitalId: Joi.string().hex().length(24).required(),
  bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-').required(),
  quantity: Joi.number().integer().min(100).max(5000).required(),
  urgency: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium')
});

exports.updateInventorySchema = Joi.object({
  bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-').required(),
  quantity: Joi.number().integer().min(0).required(),
  expiryDate: Joi.date().min('now').required() // Must be a future date
});

exports.registerHospitalSchema = Joi.object({
  name: Joi.string().trim().required(),
  address: Joi.string().trim().required(),
  location: Joi.object({
    type: Joi.string().valid('Point').required(),
    coordinates: Joi.array().items(Joi.number()).length(2).required(),
    properties: Joi.object({
      city: Joi.string(),
      country: Joi.string(),
      address: Joi.string()
    }).unknown(true)
  }).required(),
  contactEmail: Joi.string().email().required(),
  contactPhone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  admins: Joi.array().items(Joi.string().hex().length(24)).optional()
});

exports.createCampaignSchema = Joi.object({
  title: Joi.string().trim().required(),
  description: Joi.string().trim().required(),
  hospitalId: Joi.string().hex().length(24).required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  location: Joi.object({
    type: Joi.string().valid('Point').required(),
    coordinates: Joi.array().items(Joi.number()).length(2).required(),
    properties: Joi.object({
      city: Joi.string(),
      country: Joi.string(),
      address: Joi.string()
    }).unknown(true)
  }).required(),
});

exports.sendNotificationSchema = Joi.object({
  userId: Joi.string().hex().length(24).required(),
  message: Joi.string().min(5).required(),
  type: Joi.string().valid('alert', 'reminder', 'campaign', 'system').default('alert'),
});

// Export the validate function for use in routes
module.exports.validate = validate;