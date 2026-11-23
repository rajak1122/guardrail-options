const { Server } = require("socket.io");

const getFirebaseAdmin = require("../config/firebaseAdmin");
const User = require("../models/User");
const PropAccount = require("../models/PropAccount");

function attachSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  // Separate namespace for authenticated trading events
  const trading = io.of("/trading");

  // Verify every trading socket connection
  trading.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const firebaseAdmin = getFirebaseAdmin();

      if (!firebaseAdmin?.auth) {
        return next(new Error("Firebase Admin unavailable"));
      }

      // Verify Firebase ID token
      const decodedToken = await firebaseAdmin.auth.verifyIdToken(token);

      // Resolve authenticated user from MongoDB
      const user = await User.findOne({
        firebaseUid: decodedToken.uid,
      });

      if (!user) {
        return next(new Error("User not found"));
      }

      // Find only this user's active trading account
      let account = null;

      if (user.activeAccountId) {
        account = await PropAccount.findOne({
          _id: user.activeAccountId,
          userId: user._id,
          status: "ACTIVE",
        });
      }

      // Fallback when activeAccountId is missing
      if (!account) {
        account = await PropAccount.findOne({
          userId: user._id,
          status: "ACTIVE",
        }).sort({ createdAt: -1 });
      }

      if (!account) {
        return next(new Error("No active trading account"));
      }

      // Save verified identity on the socket
      socket.data.firebaseUid = decodedToken.uid;
      socket.data.userId = user._id.toString();
      socket.data.accountId = account._id.toString();

      return next();
    } catch (error) {
      console.error("Trading socket authentication failed:", error.message);

      return next(new Error("Socket authentication failed"));
    }
  });

  // Automatically join the verified user's account room
  trading.on("connection", (socket) => {
    const accountId = socket.data.accountId;

    socket.join(accountId);

    console.log(`Authenticated trading socket connected: ${accountId}`);
  });

  return io;
}

module.exports = attachSocketServer;
