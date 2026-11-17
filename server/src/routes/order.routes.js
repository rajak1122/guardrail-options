const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const matchingEngine = require("../services/matchingEngine");
const Account = require("../models/PropAccount");
const Position = require("../models/Position");
const TradeHistory = require("../models/TradeHistory");
const User = require("../models/User");

/**
 * @route   POST /api/orders/place
 * @desc    Place a new options order (Market/Limit/SL)
 */
router.post("/place", async (req, res) => {
  try {
    const {
      firebaseUid,
      userId,
      orderData,
      currentTickPrice,
      currentGreeks,
      symbol,
      optionType,
      strikePrice,
      quantity,
      orderType,
      entryPrice,
    } = req.body;

    const targetId = firebaseUid || userId;
    if (!targetId) {
      return res
        .status(400)
        .json({ error: "User ID is required in request body." });
    }

    let activeAccount = null;

    if (mongoose.Types.ObjectId.isValid(targetId)) {
      // 1. Direct match on PropAccount.userId (matches your Compass document!)
      activeAccount = await Account.findOne({
        userId: targetId,
        status: "ACTIVE",
      });

      // 2. Fallback: Direct match on PropAccount._id
      if (!activeAccount) {
        activeAccount = await Account.findById(targetId);
      }
    }

    // 3. Fallback: If targetId is a Firebase UID string, resolve User first then PropAccount
    if (!activeAccount) {
      const user = await User.findOne({ firebaseUid: targetId });
      if (user) {
        activeAccount =
          (user.activeAccountId &&
            (await Account.findById(user.activeAccountId))) ||
          (await Account.findOne({ userId: user._id, status: "ACTIVE" }));
      }
    }

    if (!activeAccount) {
      return res
        .status(400)
        .json({ error: "User or active trading account not found." });
    }

    const structuredOrderData = orderData || {
      symbol,
      optionType,
      strikePrice,
      quantity,
      orderType,
      entryPrice,
    };

    const result = await matchingEngine.placeOrder(
      activeAccount._id,
      structuredOrderData,
      currentTickPrice || entryPrice,
      currentGreeks,
    );

    res.json(result);
  } catch (error) {
    console.error("Order placement error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * @route   GET /api/orders/positions/:firebaseUid
 * @desc    Get open positions for the user's active account
 */
router.get("/positions/:firebaseUid", async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.params.firebaseUid });
    if (!user || !user.activeAccountId) return res.json([]);

    const positions = await Position.find({ accountId: user.activeAccountId });
    res.json(positions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/orders/history/:firebaseUid
 * @desc    Get closed trade history for journaling and analytics
 */
router.get("/history/:firebaseUid", async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.params.firebaseUid });
    if (!user || !user.activeAccountId) return res.json([]);

    const history = await TradeHistory.find({
      accountId: user.activeAccountId,
    }).sort({ exitTime: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
