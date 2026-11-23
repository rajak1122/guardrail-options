const express = require("express");
const router = express.Router();

const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/sync", authMiddleware, async (req, res) => {
  try {
    const { uid, email, name } = req.user;

    if (!uid || !email) {
      return res.status(400).json({
        error: "Authenticated Firebase account must have an email.",
      });
    }

    const initialDisplayName =
      req.body?.displayName || name || email.split("@")[0];

    const user = await User.findOneAndUpdate(
      { firebaseUid: uid },
      {
        $set: {
          email,
        },
        $setOnInsert: {
          displayName: initialDisplayName,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
        runValidators: true,
      },
    );

    return res.json({
      message: "User synced successfully",
      user,
    });
  } catch (error) {
    console.error("Auth sync error:", error);

    return res.status(500).json({
      error: "Failed to sync user account.",
    });
  }
});

module.exports = router;
