const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/config');

/**
 * Protects routes by verifying JWT token.
 */
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  } /*else if (req.cookies.token) {
    // Set token from cookie
    token = req.cookies.token
  }*/

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    // Fetch user from database to ensure the user still exists and has the correct role etc.
    req.user = await User.findById(decoded.id);

    if (!req.user) {
        // TODO: Consider if the token is invalid (e.g., expired or tampered),
        //       or if the user associated with the token has been deleted.
        //       The current error message covers both scenarios.
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }
    next();
  } catch (err) {
    // TODO: Differentiate between token expiration and other JWT verification errors.
    //       For now, a generic "Not authorized" is used for simplicity.
    //       If err.name === 'TokenExpiredError', you could return a specific message.
    console.error(err.message); // Log the error for debugging purposes
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

/**
 * Authorizes users based on roles.
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'donor', 'hospital_admin').
 */
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Check if user is authenticated and if their role is included in the allowed roles
    if (!req.user) {
        // If req.user is not set, it means the protect middleware failed.
        // This is a safeguard, though typically the protect middleware should have already handled it.
        return next(new ErrorResponse('Authentication required. Please log in.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ErrorResponse(`User role ${req.user.role} is not authorized to access this route`, 403));
    }
    next();
  };
};