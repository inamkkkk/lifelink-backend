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
    req.user = await User.findById(decoded.id);

    if (!req.user) {
        return next(new ErrorResponse('User not found with this token', 401));
    }
    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

/**
 * Authorizes users based on roles.
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'donor', 'hospital_admin').
 */
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ErrorResponse(`User role ${req.user ? req.user.role : 'unauthenticated'} is not authorized to access this route`, 403));
    }
    next();
  };
};
