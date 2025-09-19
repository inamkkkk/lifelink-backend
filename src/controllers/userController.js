const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/userService');
const ErrorResponse = require('../utils/errorResponse');

exports.registerUser = asyncHandler(async (req, res, next) => {
  const { user, token } = await userService.registerUser(req.body);
  res.status(201).json({ success: true, data: user, token });
});

exports.loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }
  const { user, token } = await userService.loginUser(email, password);
  res.status(200).json({ success: true, data: user, token });
});

exports.getUserProfile = asyncHandler(async (req, res, next) => {
  // For authenticated user, req.user._id is available
  const userId = req.params.id === 'me' ? req.user.id : req.params.id;
  
  // Authorization: A user can view their own profile, or an admin can view any profile
  if (req.user.role !== 'system_admin' && userId !== req.user.id.toString()) {
      return next(new ErrorResponse('Not authorized to view this profile', 403));
  }

  const user = await userService.getUserProfile(userId);
  res.status(200).json({ success: true, data: user });
});

exports.updateUserProfile = asyncHandler(async (req, res, next) => {
  const userId = req.params.id === 'me' ? req.user.id : req.params.id;

  // Authorization: A user can update their own profile, or an admin can update any profile
  if (req.user.role !== 'system_admin' && userId !== req.user.id.toString()) {
      return next(new ErrorResponse('Not authorized to update this profile', 403));
  }

  const updatedUser = await userService.updateUserProfile(userId, req.body);
  res.status(200).json({ success: true, data: updatedUser });
});
