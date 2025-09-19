const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/userService');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @description Register a new user
 * @route POST /api/v1/auth/register
 * @access Public
 */
exports.registerUser = asyncHandler(async (req, res, next) => {
  const { user, token } = await userService.registerUser(req.body);
  res.status(201).json({ success: true, data: user, token });
});

/**
 * @description Login a user
 * @route POST /api/v1/auth/login
 * @access Public
 */
exports.loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }
  const { user, token } = await userService.loginUser(email, password);
  res.status(200).json({ success: true, data: user, token });
});

/**
 * @description Get a user profile
 * @route GET /api/v1/users/:id
 * @access Private
 */
exports.getUserProfile = asyncHandler(async (req, res, next) => {
  // For authenticated user, req.user._id is available
  const userId = req.params.id === 'me' ? req.user.id : req.params.id;

  // Authorization: A user can view their own profile, or an admin can view any profile
  if (req.user.role !== 'system_admin' && userId !== req.user.id.toString()) {
    return next(new ErrorResponse('Not authorized to view this profile', 403));
  }

  const user = await userService.getUserProfile(userId);
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  res.status(200).json({ success: true, data: user });
});

/**
 * @description Update a user profile
 * @route PUT /api/v1/users/:id
 * @access Private
 */
exports.updateUserProfile = asyncHandler(async (req, res, next) => {
  const userId = req.params.id === 'me' ? req.user.id : req.params.id;

  // Authorization: A user can update their own profile, or an admin can update any profile
  if (req.user.role !== 'system_admin' && userId !== req.user.id.toString()) {
    return next(new ErrorResponse('Not authorized to update this profile', 403));
  }

  // Ensure password is not updated directly via this endpoint if it's not intended
  if (req.body.password) {
    return next(new ErrorResponse('Password can only be reset through the password reset flow', 400));
  }

  const updatedUser = await userService.updateUserProfile(userId, req.body);
  if (!updatedUser) {
    return next(new ErrorResponse('User not found', 404));
  }
  res.status(200).json({ success: true, data: updatedUser });
});