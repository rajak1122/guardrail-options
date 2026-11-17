const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

/**
 * @route   POST /api/auth/sync
 * @desc    Sync the verified Firebase user with MongoDB.
 */
router.post("/sync", authMiddleware, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;
    const email = req.user.email;
    const displayName = req.body.displayName || req.user.name || "";

    if (!firebaseUid || !email) {
      return res.status(400).json({
        error: "The authenticated Firebase account must have an email address.",
      });
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      {
        $set: {
          email,
          displayName: displayName || email.split("@")[0],
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return res.json({ message: "User synced successfully", user });
  } catch (error) {
    console.error("Auth sync error:", error);
    return res.status(500).json({ error: "Failed to sync user account." });
  }
});

module.exports = router;
