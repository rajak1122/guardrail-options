const express = require("express");
const router = express.Router();
const matchingEngine = require("../services/matchingEngine");
const Position = require("../models/Position");
const TradeHistory = require("../models/TradeHistory");
const User = require("../models/User");

/**
 * @route   POST /api/orders/place
 * @desc    Place a new options order (Market/Limit/SL)
 */
router.post("/place", async (req, res) => {
  try {
    const { firebaseUid, orderData, currentTickPrice, currentGreeks } =
      req.body;

    const user = await User.findOne({ firebaseUid });
    if (!user || !user.activeAccountId) {
      return res
        .status(400)
        .json({ error: "User or active trading account not found." });
    }

    const result = await matchingEngine.placeOrder(
      user.activeAccountId,
      orderData,
      currentTickPrice,
      currentGreeks,
    );

    res.json(result);
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(400).json({ error: error.message });
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
