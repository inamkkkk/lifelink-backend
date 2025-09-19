const ErrorResponse = require('../utils/errorResponse');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Deep copy the error to avoid modifying the original error object
  // This is especially important if the original error is an instance of a class
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  // TODO: Implement more robust logging, e.g., to a file or a centralized logging service.
  // Using Winston or Pino for more advanced logging capabilities.
  logger.error('Error Handler Middleware:', { stack: err.stack, message: err.message });

  // Mongoose Bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue);
    const message = `Duplicate field value entered for ${field}: '${err.keyValue[field]}'. Please use another value.`;
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    error = new ErrorResponse(messages.join(', '), 400);
  }

  // Joi validation error
  if (error.isJoi) { // Changed err to error to check the copied object
    const message = error.details.map(d => d.message).join(', ');
    error = new ErrorResponse(message, 400);
  }

  // JWT error - invalid token
  if (err.name === 'JsonWebTokenError') {
    const message = 'Not authorized, token failed';
    error = new ErrorResponse(message, 401);
  }

  // JWT error - expired token
  if (err.name === 'TokenExpiredError') {
    const message = 'Not authorized, token expired';
    error = new ErrorResponse(message, 401);
  }

  // TODO: Add handling for other common error types (e.g., generic errors, custom application errors).
  // Consider adding a default error message for unexpected errors.

  res.status(error.statusCode || 500).json({
    success: false,
    // If error.message is not set, use a generic server error message.
    error: error.message || 'Server Error',
  });
};

module.exports = errorHandler;