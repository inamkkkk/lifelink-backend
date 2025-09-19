const Notification = require('../models/Notification');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

exports.sendNotification = async (userId, message, type = 'alert') => {
  const user = await User.findById(userId);
  if (!user) {
    // Log error but don't stop the process, notifications are often fire-and-forget
    console.error(`Attempted to send notification to non-existent user: ${userId}`);
    // return new ErrorResponse(`User with ID ${userId} not found for notification`, 404);
    return null; // Return null on failure
  }

  const notification = await Notification.create({
    userId,
    message,
    type,
    status: 'unread',
  });

  // TODO: Implement real-time notification delivery (e.g., via WebSockets/Socket.io)
  // If user is online, push notification to their active session.
  // Example: io.to(userId.toString()).emit('newNotification', notification);

  return notification;
};

exports.getNotificationsForUser = async (userId, status = 'unread') => {
  const notifications = await Notification.find({ userId, status }).sort({ createdAt: -1 });
  return notifications;
};

exports.markNotificationAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { status: 'read' },
    { new: true }
  );

  if (!notification) {
    throw new ErrorResponse('Notification not found or not authorized to update', 404);
  }
  return notification;
};

// TODO: Implement bulk mark as read, delete notifications, etc.
