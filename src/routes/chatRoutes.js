const express = require('express');
const { startChat } = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// This HTTP endpoint serves as an initial handshake or to provide chat room information.
// It's crucial to understand that this route **does not** handle real-time chat messages.
// Real-time communication is typically managed via WebSockets, which would be handled
// by a separate WebSocket server (e.g., using Socket.IO or ws library).
//
// This route is designed to:
// 1. Authenticate the user (via `protect` middleware).
// 2. Potentially retrieve information about a specific chat room based on `roomId`.
// 3. Return data that a client might need to establish a WebSocket connection,
//    such as room details, participant lists, or authentication tokens for the WebSocket.
router.get('/:roomId', protect, startChat);

module.exports = router;