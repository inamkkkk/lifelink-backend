const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const { generateToken } = require('../utils/jwt');
const { geocodeAddress } = require('../utils/geoUtils');

// TODO: Consider adding more robust error handling and input validation for all methods.

exports.registerUser = async (userData) => {
  const { email, location } = userData;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ErrorResponse('User with this email already exists', 400);
  }

  // Geocode location if provided as a string
  if (location && typeof location === 'string') {
    const geoData = await geocodeAddress(location);
    if (geoData) {
      userData.location = geoData; // Assign geocoded data back to userData
    } else {
      // If geocoding fails, throw an error to prevent user creation with invalid location
      throw new ErrorResponse('Could not geocode provided location', 400);
    }
  }

  const user = await User.create(userData);
  const token = generateToken(user._id);
  return { user, token };
};

exports.loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select('+password'); // Ensure password is selected for comparison

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
  // Fetch user and exclude password field
  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }
  return user;
};

exports.updateUserProfile = async (userId, updateData) => {
  // Prevent direct updates of sensitive fields
  if (updateData.password) {
    throw new ErrorResponse('Password cannot be updated directly via this route. Use a dedicated password reset/change route.', 400);
  }
  if (updateData.email) {
    throw new ErrorResponse('Email cannot be updated directly via this route. Use a dedicated email verification flow.', 400);
  }
  // Business logic for role updates - example: only admins can change roles or specific roles are allowed
  if (updateData.role && updateData.role !== 'donor') { // Example: prevent non-admin role changes or specific role changes
    throw new ErrorResponse('Role update is not permitted via this route', 403);
  }

  // Geocode location if provided as a string during update
  if (updateData.location && typeof updateData.location === 'string') {
    const geoData = await geocodeAddress(updateData.location);
    if (geoData) {
      updateData.location = geoData; // Assign geocoded data
    } else {
      throw new ErrorResponse('Could not geocode provided location', 400);
    }
  }

  // Find user and update, ensuring new document and validators are run
  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true, // Return the modified document
    runValidators: true, // Ensure validators are run on the update
  }).select('-password'); // Exclude password from the returned user

  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }
  return user;
};

// TODO: Implement password reset functionality.
// TODO: Implement email verification flow.
// TODO: Implement a route for changing password.
// TODO: Implement a route for verifying email.
// TODO: Implement user deletion logic.
// TODO: Implement user search/listing functionality.