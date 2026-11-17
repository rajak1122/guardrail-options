const getFirebaseAdmin = require("../config/firebaseAdmin");

const authMiddleware = async (req, res, next) => {
  try {
    const admin = getFirebaseAdmin();
    if (!admin) {
      return res.status(503).json({
        error: "Firebase Admin is not configured on the server.",
      });
    }

    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    req.user = await admin.auth().verifyIdToken(token);
    return next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res
      .status(401)
      .json({ error: "Unauthorized: Invalid or expired token" });
  }
};

module.exports = authMiddleware;
