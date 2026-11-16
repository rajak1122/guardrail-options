const express = require("express");
const router = express.Router();
const User = require("../models/User");

/**
 * @route   POST /api/auth/sync
 * @desc    Sync Firebase authenticated user with MongoDB (atomic upsert to prevent race conditions)
 */
router.post("/sync", async (req, res) => {
  try {
    const { firebaseUid, email, displayName } = req.body;
    if (!firebaseUid || !email) {
      return res.status(400).json({ error: "Missing firebaseUid or email." });
    }

    // Atomic findOneAndUpdate with upsert prevents concurrent duplicate key errors
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

    res.json({ message: "User synced successfully", user });
  } catch (error) {
    console.error("Auth sync error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
