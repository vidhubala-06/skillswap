const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');

let io;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true
    }
  });

  io.use((socket, next) => {
    try {
      const rawCookies = socket.handshake.headers.cookie;
      if (!rawCookies) return next(new Error('No cookies'));

      const cookies = cookie.parse(rawCookies);
      const token = cookies.accessToken;
      if (!token) return next(new Error('Not authenticated'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(socket.userId);

    socket.on('join-conversation', (conversationId) => {
      socket.join(conversationId);
    });

    socket.on('leave-conversation', (conversationId) => {
      socket.leave(conversationId);
    });

    socket.on('join-swap', (swapId) => {
      socket.join(swapId);
    });

    socket.on('leave-swap', (swapId) => {
      socket.leave(swapId);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

module.exports = { initSocket, getIO };