const express = require("express");
const router = express.Router();
const TradeHistory = require("../models/TradeHistory");
const PropAccount = require("../models/PropAccount");
const User = require("../models/User");

/**
 * @route   POST /api/journal/submit
 * @desc    Submit a mandatory post-trade journal entry to unlock trading
 */
router.post("/submit", async (req, res) => {
  try {
    const { firebaseUid, tradeId, setupTag, emotionTag, followedPlan, notes } =
      req.body;

    const user = await User.findOne({ firebaseUid });
    if (!user || !user.activeAccountId) {
      return res
        .status(400)
        .json({ error: "User or active account not found." });
    }

    const trade = await TradeHistory.findOne({
      _id: tradeId,
      accountId: user.activeAccountId,
    });
    if (!trade) {
      return res.status(404).json({ error: "Trade history record not found." });
    }

    // Update trade journal fields
    trade.isJournaled = true;
    trade.journal = {
      setupTag: setupTag || "MOMENTUM_SCALP",
      emotionTag: emotionTag || "CALM_DISCIPLINED",
      followedPlan: followedPlan !== undefined ? followedPlan : true,
      notes: notes || "",
      submittedAt: new Date(),
    };
    await trade.save();

    // Unlock account if this was the trade triggering the lock
    const account = await PropAccount.findById(user.activeAccountId);
    if (
      account &&
      account.lastUnjournaledTradeId &&
      account.lastUnjournaledTradeId.toString() === tradeId
    ) {
      account.hasUnjournaledTrade = false;
      account.lastUnjournaledTradeId = null;
      await account.save();
    }

    res.json({
      message: "Journal submitted successfully. Trading unlocked!",
      trade,
      account,
    });
  } catch (error) {
    console.error("Error submitting journal:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
