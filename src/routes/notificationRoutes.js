const express = require('express');
const { sendNotification, getUserNotifications, markNotificationRead } = require('../controllers/notificationController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const { validate, sendNotificationSchema } = require('../middlewares/validationMiddleware');

const router = express.Router();

// Only system admins or internal services should send notifications directly via this API
router.post('/send', protect, authorizeRoles('system_admin'), validate(sendNotificationSchema), sendNotification);
// Users can get their own notifications
router.get('/me', protect, getUserNotifications);
// Users can mark their own notifications as read
router.put('/:id/read', protect, markNotificationRead);

module.exports = router;