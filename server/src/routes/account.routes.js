const express = require("express");
const router = express.Router();
const PropAccount = require("../models/PropAccount");
const User = require("../models/User");

/**
 * @route   POST /api/accounts/init
 * @desc    Initialize or reset a trading account with a chosen capital tier
 */
router.post("/init", async (req, res) => {
  try {
    const { firebaseUid, email, accountSize } = req.body;

    // Validate capital tier
    const validTiers = [50000, 100000, 200000, 500000, 1000000];
    const size = Number(accountSize) || 500000;
    if (!validTiers.includes(size)) {
      return res
        .status(400)
        .json({ error: "Invalid account size tier selected." });
    }

    // Find or create user
    let user = await User.findOne({ firebaseUid });
    if (!user) {
      user = await User.create({
        firebaseUid,
        email,
        displayName: email?.split("@")[0] || "Trader",
      });
    }

    // Check if account already exists for user
    let account = await PropAccount.findOne({ userId: user._id });
    if (account) {
      // Reset or update existing account
      account.accountSize = size;
      account.startingBalance = size;
      account.currentBalance = size;
      account.dailyStartingBalance = size;
      account.highWaterMark = size;
      account.status = "ACTIVE";
      account.breachReason = null;
      account.breachedAt = null;
      account.hasUnjournaledTrade = false;
      account.lastUnjournaledTradeId = null;
      await account.save();
    } else {
      // Create new account
      account = await PropAccount.create({
        userId: user._id,
        accountSize: size,
        startingBalance: size,
        currentBalance: size,
        dailyStartingBalance: size,
        highWaterMark: size,
      });
      user.activeAccountId = account._id;
      await user.save();
    }

    res.json({ message: "Account initialized successfully", account });
  } catch (error) {
    console.error("Error initializing account:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/accounts/:userId
 * @desc    Get active account details and drawdown metrics
 */
router.get("/:firebaseUid", async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.params.firebaseUid });
    if (!user || !user.activeAccountId) {
      return res
        .status(404)
        .json({ error: "No active account found for user." });
    }

    const account = await PropAccount.findById(user.activeAccountId);
    if (!account) return res.status(404).json({ error: "Account not found." });

    // Calculate live drawdown percentages
    const currentDrawdownAmount =
      account.highWaterMark - account.currentBalance;
    const currentDrawdownPercent = (
      (currentDrawdownAmount / account.accountSize) *
      100
    ).toFixed(2);
    const dailyPnL = account.currentBalance - account.dailyStartingBalance;
    const dailyPnLPercent = (
      (dailyPnL / account.dailyStartingBalance) *
      100
    ).toFixed(2);

    res.json({
      account,
      metrics: {
        currentDrawdownAmount,
        currentDrawdownPercent: Number(currentDrawdownPercent),
        dailyPnL,
        dailyPnLPercent: Number(dailyPnLPercent),
      },
    });
  } catch (error) {
    console.error("Error fetching account:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
