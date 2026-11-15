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

/**
 * @route   GET /api/journal/analytics/:firebaseUid
 * @desc    Step 3.4: Aggregate Win Rate, Profit Factor, and Discipline Metrics
 */
router.get("/analytics/:firebaseUid", async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.params.firebaseUid });
    if (!user || !user.activeAccountId) {
      return res.json({ totalTrades: 0, winRate: 0, profitFactor: 0 });
    }

    const trades = await TradeHistory.find({
      accountId: user.activeAccountId,
      isJournaled: true,
    });

    let winningTrades = 0;
    let grossProfit = 0;
    let grossLoss = 0;

    trades.forEach((t) => {
      if (t.netPnL > 0) {
        winningTrades++;
        grossProfit += t.netPnL;
      } else {
        grossLoss += Math.abs(t.netPnL);
      }
    });

    const totalTrades = trades.length;
    const winRate =
      totalTrades > 0
        ? Number(((winningTrades / totalTrades) * 100).toFixed(2))
        : 0;
    const profitFactor =
      grossLoss > 0
        ? Number((grossProfit / grossLoss).toFixed(2))
        : grossProfit > 0
          ? 99.99
          : 0;

    res.json({
      totalTrades,
      winningTrades,
      losingTrades: totalTrades - winningTrades,
      winRate,
      grossProfit,
      grossLoss,
      profitFactor,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
