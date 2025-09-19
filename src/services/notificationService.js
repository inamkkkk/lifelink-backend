const Notification = require('../models/Notification');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// Assuming you have a way to manage active WebSocket connections, e.g., using Socket.IO
// For demonstration, we'll assume `io` is globally available or imported elsewhere.
// If not, you'll need to import or initialize it here.
// Example: const { Server } = require("socket.io"); const io = new Server(httpServer);
let io; // Placeholder for Socket.IO instance

// Function to set the Socket.IO instance
const setIoInstance = (socketIoInstance) => {
  io = socketIoInstance;
};

exports.sendNotification = async (userId, message, type = 'alert') => {
  // Validate userId
  if (!userId) {
    console.error('User ID is required for sending notifications.');
    return null;
  }

  const user = await User.findById(userId);
  if (!user) {
    // Log error but don't stop the process, notifications are often fire-and-forget
    console.error(`Attempted to send notification to non-existent user: ${userId}`);
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
  if (io) {
    // Assuming user IDs are used as room identifiers in Socket.IO
    io.to(userId.toString()).emit('newNotification', notification);
  } else {
    console.warn('Socket.IO instance not set. Real-time notifications will not be delivered.');
  }

  return notification;
};

exports.getNotificationsForUser = async (userId, status = 'unread') => {
  if (!userId) {
    throw new ErrorResponse('User ID is required to retrieve notifications.', 400);
  }
  const notifications = await Notification.find({ userId, status }).sort({ createdAt: -1 });
  return notifications;
};

exports.markNotificationAsRead = async (notificationId, userId) => {
  if (!notificationId || !userId) {
    throw new ErrorResponse('Notification ID and User ID are required.', 400);
  }

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

/**
 * Marks multiple notifications as read for a given user.
 * @param {string[]} notificationIds - An array of notification IDs to mark as read.
 * @param {string} userId - The ID of the user whose notifications are being updated.
 * @returns {Promise<object>} - An object containing the count of updated notifications.
 */
exports.markNotificationsAsReadBulk = async (notificationIds, userId) => {
  if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
    throw new ErrorResponse('A valid array of notification IDs is required.', 400);
  }
  if (!userId) {
    throw new ErrorResponse('User ID is required.', 400);
  }

  const result = await Notification.updateMany(
    { _id: { $in: notificationIds }, userId },
    { $set: { status: 'read' } }
  );

  // Check if any documents were actually modified, though updateMany doesn't throw for no matches.
  // We can infer success if result.modifiedCount > 0 or if we want to be stricter,
  // check if all requested IDs were found and updated. For now, returning the count is sufficient.
  if (result.modifiedCount === 0 && notificationIds.length > 0) {
    // This might indicate that none of the provided notification IDs belonged to the user
    // or they were already read. Depending on requirements, you might want to log this
    // or return a more specific message.
    console.warn(`No notifications were marked as read for user ${userId} with provided IDs.`);
  }

  return { modifiedCount: result.modifiedCount };
};

/**
 * Deletes a specific notification for a given user.
 * @param {string} notificationId - The ID of the notification to delete.
 * @param {string} userId - The ID of the user whose notification is being deleted.
 * @returns {Promise<object>} - An object indicating the success of the deletion.
 */
exports.deleteNotification = async (notificationId, userId) => {
  if (!notificationId || !userId) {
    throw new ErrorResponse('Notification ID and User ID are required for deletion.', 400);
  }

  const result = await Notification.deleteOne({ _id: notificationId, userId });

  if (result.deletedCount === 0) {
    throw new ErrorResponse('Notification not found or not authorized to delete', 404);
  }

  return { success: true, deletedCount: result.deletedCount };
};

/**
 * Deletes multiple notifications for a given user.
 * @param {string[]} notificationIds - An array of notification IDs to delete.
 * @param {string} userId - The ID of the user whose notifications are being deleted.
 * @returns {Promise<object>} - An object containing the count of deleted notifications.
 */
exports.deleteNotificationsBulk = async (notificationIds, userId) => {
  if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
    throw new ErrorResponse('A valid array of notification IDs is required for bulk deletion.', 400);
  }
  if (!userId) {
    throw new ErrorResponse('User ID is required.', 400);
  }

  const result = await Notification.deleteMany({ _id: { $in: notificationIds }, userId });

  if (result.deletedCount === 0) {
    console.warn(`No notifications were deleted for user ${userId} with provided IDs.`);
  }

  return { deletedCount: result.deletedCount };
};

// Export the function to set the IO instance if needed by the application structure
module.exports = {
  sendNotification: exports.sendNotification,
  getNotificationsForUser: exports.getNotificationsForUser,
  markNotificationAsRead: exports.markNotificationAsRead,
  markNotificationsAsReadBulk: exports.markNotificationsAsReadBulk,
  deleteNotification: exports.deleteNotification,
  deleteNotificationsBulk: exports.deleteNotificationsBulk,
  setIoInstance, // Exporting this to allow external setting of the Socket.IO instance
};