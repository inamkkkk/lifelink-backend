const asyncHandler = require('../utils/asyncHandler');
const notificationService = require('../services/notificationService');
const ErrorResponse = require('../utils/errorResponse');

exports.sendNotification = asyncHandler(async (req, res, next) => {
  // This endpoint would typically be used by system admins or internal services.
  // It's not usually directly exposed for general users.
  const { userId, message, type } = req.body;
  const notification = await notificationService.sendNotification(userId, message, type);
  if (!notification) {
    return next(new ErrorResponse('Failed to send notification, user might not exist', 400));
  }
  res.status(201).json({ success: true, data: notification });
});

exports.getUserNotifications = asyncHandler(async (req, res, next) => {
  const notifications = await notificationService.getNotificationsForUser(req.user.id, req.query.status || 'unread');
  res.status(200).json({ success: true, data: notifications });
});

exports.markNotificationRead = asyncHandler(async (req, res, next) => {
  const notification = await notificationService.markNotificationAsRead(req.params.id, req.user.id);
  res.status(200).json({ success: true, data: notification });
});
