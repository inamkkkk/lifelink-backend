const logger = require('../utils/logger');
const jwt = require('jsonwebtoken'); // Assuming you have a JWT library
// const { User } = require('../models/user'); // Assuming you have a User model
// const { ChatMessage } = require('../models/chatMessage'); // Assuming you have a ChatMessage model

// TODO: Implement WebSockets (Socket.IO) for real-time chat.
// Steps:
// 1. Integrate Socket.IO with your Express server.
// 2. Handle connection/disconnection of users (authenticate WebSocket connections with JWT).
// 3. Manage chat rooms (e.g., /chat/:roomId, where roomId could be a Donation ID, Request ID, or a direct user-to-user chat ID).
// 4. Implement message broadcasting within rooms.
// 5. Persist chat messages to a database (e.g., a new `ChatMessage` model).
// 6. Handle typing indicators, read receipts, etc.
// 7. Ensure secure communication over WebSockets.

// NOTE: The actual Socket.IO setup should ideally be in a separate file (e.g., socketSetup.js)
// or within your main server.js file, after the HTTP server is created.
// This service file will focus on exposing endpoints that might *trigger* chat-related actions,
// or provide necessary configurations.

exports.startChat = (req, res) => {
  const { roomId } = req.params;
  logger.info(`Attempting to start chat for room: ${roomId}`);
  // This endpoint serves as a placeholder. In a real application,
  // the client would typically initiate the WebSocket connection independently after this,
  // possibly after validating the roomId or fetching necessary chat history.

  res.json({
    status: 'stub',
    message: 'WebSocket chat initiation endpoint. Establish a WebSocket connection to your Socket.IO server for real-time chat.',
    roomId: roomId
  });
};

// Placeholder for JWT secret - should be loaded from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'a_very_secret_key_for_development';

// This function demonstrates how Socket.IO would be set up.
// It should be called after your HTTP server is created.
const setupSocketIO = (httpServer) => {
  const io = require('socket.io')(httpServer, {
    cors: {
      origin: '*', // Adjust for production environment
      methods: ['GET', 'POST']
    }
  });

  io.use(async (socket, next) => {
    // Implement JWT authentication for WebSocket connection
    const token = socket.handshake.auth.token;
    if (!token) {
      logger.warn('WebSocket connection attempt without token.');
      return next(new Error('Authentication error: No token provided'));
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      // Replace with actual user fetching logic from your database
      // const user = await User.findById(decoded.id).select('-password');
      // if (!user) {
      //   logger.warn(`WebSocket authentication failed: User not found for ID ${decoded.id}`);
      //   return next(new Error('Authentication error: User not found'));
      // }
      // socket.user = user; // Attach user to socket for later use

      // Mocking user for demonstration if User model is not available
      socket.user = { id: decoded.id, fullName: `User_${decoded.id.substring(0, 5)}` };
      logger.info(`WebSocket authenticated user: ${socket.user.fullName} (ID: ${socket.user.id})`);
      next();
    } catch (err) {
      logger.error(`WebSocket authentication error: ${err.message}`);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // const userId = socket.user.id; // Use the authenticated user ID
    const userName = socket.user.fullName; // Use the authenticated user name
    logger.info(`User ${userName} connected via WebSocket.`);

    socket.on('joinRoom', (roomId) => {
      if (!roomId) {
        logger.warn(`Received joinRoom without roomId from ${userName}`);
        return;
      }
      socket.join(roomId);
      logger.info(`${userName} joined room: ${roomId}`);
      // Broadcast to the room, excluding the sender
      socket.broadcast.to(roomId).emit('message', { user: 'System', text: `${userName} has joined the chat.`, timestamp: new Date() });
      // Send a confirmation back to the user
      socket.emit('joinedRoom', { roomId: roomId, message: `You have joined room: ${roomId}` });
    });

    socket.on('sendMessage', async ({ roomId, message }) => {
      if (!roomId || !message) {
        logger.warn(`Received sendMessage with incomplete data from ${userName}`);
        return;
      }
      // TODO: Persist chat messages to a database (e.g., new ChatMessage model)
      // try {
      //   await ChatMessage.create({ sender: userId, room: roomId, text: message });
      //   logger.info(`Message saved to DB for room ${roomId} from ${userName}`);
      // } catch (dbError) {
      //   logger.error(`Failed to save message to DB for room ${roomId}: ${dbError.message}`);
      //   // Optionally emit an error back to the sender
      //   socket.emit('messageError', { message: 'Failed to send message.' });
      //   return; // Do not broadcast if DB save failed
      // }

      // Broadcast message to all clients in the room, including sender
      io.to(roomId).emit('message', { user: userName, text: message, timestamp: new Date() });
      logger.info(`Message broadcast to room ${roomId}: "${message}" from ${userName}`);
    });

    // TODO: Implement typing indicators
    socket.on('typing', ({ roomId, isTyping }) => {
      socket.broadcast.to(roomId).emit('typing', { user: userName, isTyping });
    });

    // TODO: Implement read receipts

    socket.on('disconnect', () => {
      logger.info(`User ${userName} disconnected from WebSocket.`);
      // Potentially broadcast a 'user left' message to relevant rooms if needed
      // io.sockets.sockets.forEach((s, id) => {
      //   if (s.rooms.has(roomId)) { // Check if the disconnecting user was in a specific room
      //      io.to(roomId).emit('userLeft', { userId: userId, userName: userName });
      //   }
      // });
    });
  });

  logger.info('Socket.IO setup complete.');
  return io; // Return io instance if needed elsewhere
};

// Expose setupSocketIO for integration in server.js
exports.setupSocketIO = setupSocketIO;