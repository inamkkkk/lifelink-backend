const asyncHandler = require('../utils/asyncHandler');
const notificationService = require('../services/notificationService');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc Send a notification to a specific user
 * @route POST /api/v1/notifications
 * @access Private (Typically Admin/Internal Services)
 */
exports.sendNotification = asyncHandler(async (req, res, next) => {
  // This endpoint would typically be used by system admins or internal services.
  // It's not usually directly exposed for general users.
  const { userId, message, type } = req.body;

  // Basic validation
  if (!userId || !message || !type) {
    return next(new ErrorResponse('Please provide userId, message, and type', 400));
  }

  // TODO: Implement more robust validation for message and type if needed.
  // For example, check if 'type' is one of the allowed notification types.

  const notification = await notificationService.sendNotification(userId, message, type);

  // The service layer should ideally handle user existence checks and return specific errors.
  // If the service returns null/undefined, we infer a failure, possibly due to non-existent user or other issues.
  if (!notification) {
    return next(new ErrorResponse('Failed to send notification. User might not exist or an internal error occurred.', 400));
  }

  res.status(201).json({ success: true, data: notification });
});

/**
 * @desc Get notifications for the authenticated user
 * @route GET /api/v1/notifications/me
 * @access Private
 */
exports.getUserNotifications = asyncHandler(async (req, res, next) => {
  // Ensure the user is authenticated and has an ID
  if (!req.user || !req.user.id) {
    return next(new ErrorResponse('User not authenticated', 401));
  }

  const statusFilter = req.query.status || 'all'; // Default to 'all' to show all statuses if not specified
  // TODO: Define and validate allowed 'status' query parameters (e.g., 'unread', 'read', 'all').
  // For now, we assume the service can handle 'all' or specific statuses.

  const notifications = await notificationService.getNotificationsForUser(req.user.id, statusFilter);

  // It's good practice to return an empty array if no notifications are found, rather than null or an error.
  // Assuming getNotificationsForUser returns an array.
  res.status(200).json({ success: true, count: notifications.length, data: notifications });
});

/**
 * @desc Mark a specific notification as read
 * @route PUT /api/v1/notifications/:id/read
 * @access Private
 */
exports.markNotificationRead = asyncHandler(async (req, res, next) => {
  const notificationId = req.params.id;
  const userId = req.user.id;

  // Ensure the user is authenticated and has an ID
  if (!userId) {
    return next(new ErrorResponse('User not authenticated', 401));
  }

  // Basic validation for notification ID
  if (!notificationId) {
    return next(new ErrorResponse('Please provide the notification ID', 400));
  }

  // TODO: Add validation to ensure notificationId is a valid format (e.g., ObjectId if using MongoDB).

  const notification = await notificationService.markNotificationAsRead(notificationId, userId);

  // If the service returns null, it could mean the notification doesn't exist,
  // or it doesn't belong to the authenticated user.
  if (!notification) {
    return next(new ErrorResponse(`Notification not found or you don't have permission to update it.`, 404));
  }

  res.status(200).json({ success: true, data: notification });
});

/**
 * @desc Mark all notifications for the authenticated user as read
 * @route PUT /api/v1/notifications/me/read/all
 * @access Private
 */
// TODO: Implement this endpoint as per the TODO comment.
exports.markAllNotificationsRead = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  if (!userId) {
    return next(new ErrorResponse('User not authenticated', 401));
  }

  // Assuming notificationService has a method to mark all as read.
  // const updatedCount = await notificationService.markAllNotificationsAsRead(userId);
  // res.status(200).json({ success: true, message: `Successfully marked ${updatedCount} notifications as read.` });

  // Placeholder implementation until service method is available
  return next(new ErrorResponse('Not Implemented: markAllNotificationsRead endpoint not yet implemented.', 501));
});