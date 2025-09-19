const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const { generateToken } = require('../utils/jwt');
const { geocodeAddress } = require('../utils/geoUtils');

exports.registerUser = async (userData) => {
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new ErrorResponse('User with this email already exists', 400);
  }

  if (userData.location && typeof userData.location === 'string') {
    const geoData = await geocodeAddress(userData.location);
    if (geoData) {
      userData.location = geoData;
    } else {
      throw new ErrorResponse('Could not geocode provided location', 400);
    }
  }

  const user = await User.create(userData);
  const token = generateToken(user._id);
  return { user, token };
};

exports.loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new ErrorResponse('Invalid credentials', 401);
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new ErrorResponse('Invalid credentials', 401);
  }

  const token = generateToken(user._id);
  return { user, token };
};

exports.getUserProfile = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }
  return user;
};

exports.updateUserProfile = async (userId, updateData) => {
  // Prevent sensitive fields from being updated directly without specific flows
  if (updateData.password) {
    throw new ErrorResponse('Password cannot be updated directly via this route. Use a dedicated password reset/change route.', 400);
  }
  if (updateData.email) {
    throw new ErrorResponse('Email cannot be updated directly via this route. Use a dedicated email verification flow.', 400);
  }
  if (updateData.role && updateData.role !== 'donor') {
    // Only allow 'donor' role change or prevent role change based on business rules
    throw new ErrorResponse('Role cannot be updated via this route', 403);
  }

  if (updateData.location && typeof updateData.location === 'string') {
    const geoData = await geocodeAddress(updateData.location);
    if (geoData) {
      updateData.location = geoData;
    } else {
      throw new ErrorResponse('Could not geocode provided location', 400);
    }
  }

  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  }).select('-password');

  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }
  return user;
};

// TODO: Implement password reset, email verification, etc.
