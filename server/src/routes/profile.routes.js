const express = require("express");
const router = express.Router();

const User = require("../models/User");

const EXPERIENCE_LEVELS = ["BEGINNER", "INTERMEDIATE", "EXPERIENCED"];

const TRADING_STYLES = ["SCALPING", "INTRADAY", "SWING"];

const INSTRUMENTS = ["NIFTY", "BANKNIFTY"];

const hasField = (object, field) =>
  Object.prototype.hasOwnProperty.call(object, field);

const buildProfileResponse = (user) => ({
  displayName: user.displayName || "",
  email: user.email || "",
  phoneNumber: user.phoneNumber || "",
  country: user.country || "",

  tradingProfile: {
    experienceLevel: user.tradingProfile?.experienceLevel || null,

    tradingStyle: user.tradingProfile?.tradingStyle || null,

    primaryInstrument: user.tradingProfile?.primaryInstrument || null,
  },
});

// GET /api/profile/:firebaseUid
router.get("/:firebaseUid", async (req, res) => {
  try {
    const user = await User.findOne({
      firebaseUid: req.params.firebaseUid,
    })
      .select("displayName email phoneNumber country tradingProfile")
      .lean();

    if (!user) {
      return res.status(404).json({
        error: "User profile not found.",
      });
    }

    res.json({
      profile: buildProfileResponse(user),
    });
  } catch (error) {
    console.error("Profile fetch error:", error);

    res.status(500).json({
      error: "Failed to fetch user profile.",
    });
  }
});

// PATCH /api/profile/:firebaseUid
router.patch("/:firebaseUid", async (req, res) => {
  try {
    const body = req.body;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({
        error: "Invalid profile data.",
      });
    }

    const updates = {};

    // Display Name
    if (hasField(body, "displayName")) {
      const value = String(body.displayName).trim();

      if (!value || value.length > 50) {
        return res.status(400).json({
          error: "Display name must contain 1 to 50 characters.",
        });
      }

      updates.displayName = value;
    }

    // Phone Number
    if (hasField(body, "phoneNumber")) {
      const value = String(body.phoneNumber ?? "").trim();

      if (value && !/^\+?[0-9\s()-]{7,20}$/.test(value)) {
        return res.status(400).json({
          error: "Please enter a valid phone number.",
        });
      }

      updates.phoneNumber = value;
    }

    // Country
    if (hasField(body, "country")) {
      const value = String(body.country ?? "").trim();

      if (value.length > 80) {
        return res.status(400).json({
          error: "Country name is too long.",
        });
      }

      updates.country = value;
    }

    // Trading Profile
    if (hasField(body, "tradingProfile")) {
      const tradingProfile = body.tradingProfile;

      if (
        !tradingProfile ||
        typeof tradingProfile !== "object" ||
        Array.isArray(tradingProfile)
      ) {
        return res.status(400).json({
          error: "Invalid trading profile.",
        });
      }

      const fields = [
        {
          name: "experienceLevel",
          allowed: EXPERIENCE_LEVELS,
        },
        {
          name: "tradingStyle",
          allowed: TRADING_STYLES,
        },
        {
          name: "primaryInstrument",
          allowed: INSTRUMENTS,
        },
      ];

      for (const field of fields) {
        if (!hasField(tradingProfile, field.name)) {
          continue;
        }

        const rawValue = tradingProfile[field.name];

        const value =
          rawValue === null || rawValue === ""
            ? null
            : String(rawValue).trim().toUpperCase();

        if (value !== null && !field.allowed.includes(value)) {
          return res.status(400).json({
            error: `Invalid ${field.name}.`,
          });
        }

        updates[`tradingProfile.${field.name}`] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: "No valid profile fields provided.",
      });
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid: req.params.firebaseUid },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    )
      .select("displayName email phoneNumber country tradingProfile")
      .lean();

    if (!user) {
      return res.status(404).json({
        error: "User profile not found.",
      });
    }

    res.json({
      message: "Profile updated successfully.",
      profile: buildProfileResponse(user),
    });
  } catch (error) {
    console.error("Profile update error:", error);

    res.status(500).json({
      error: "Failed to update user profile.",
    });
  }
});

module.exports = router;
