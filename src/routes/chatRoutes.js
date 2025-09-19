const express = require('express');
const { startChat } = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// This HTTP endpoint serves as an initial handshake or to provide chat room information.
// The actual real-time communication will occur over WebSockets (e.g., Socket.IO).
// Clients will typically initiate a WebSocket connection to a dedicated WebSocket server endpoint (e.g., ws://your-app/socket.io/ for Socket.IO).
router.get('/:roomId', protect, startChat);

module.exports = router;
