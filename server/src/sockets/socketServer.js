const { Server } = require('socket.io');

function attachSocketServer(httpServer) {
  return new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });
}

module.exports = attachSocketServer;
