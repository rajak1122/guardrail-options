const express = require("express");
const router = express.Router();
const TradeHistory = require("../models/TradeHistory");
const PropAccount = require("../models/PropAccount");
const User = require("../models/User");
const mongoose = require("mongoose")

/**
 * @route   POST /api/journal/submit
 * @desc    Submit a mandatory post-trade journal entry to unlock trading
 */

router.post("/submit", async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { firebaseUid, tradeId, setupTag, emotionTag, followedPlan, notes } =
      req.body;

    const user = await User.findOne({ firebaseUid });

    if (!user || !user.activeAccountId) {
      return res
        .status(400)
        .json({ error: "User or active account not found." });
    }

    let result = null;

    await session.withTransaction(async () => {
      // Find the selected trade belonging to this account.
      const trade = await TradeHistory.findOne({
        _id: tradeId,
        accountId: user.activeAccountId,
      }).session(session);

      if (!trade) {
        throw new Error("Trade history record not found.");
      }

      if (trade.isJournaled) {
        throw new Error("This trade has already been journaled.");
      }

      // Save journal details.
      trade.isJournaled = true;
      trade.journal = {
        setupTag: setupTag || "MOMENTUM_SCALP",
        emotionTag: emotionTag || "CALM_DISCIPLINED",
        followedPlan: followedPlan !== undefined ? followedPlan : true,
        notes: notes || "",
        submittedAt: new Date(),
      };

      await trade.save({ session });

      // Find the next oldest unjournaled trade.
      const nextPendingTrade = await TradeHistory.findOne({
        accountId: user.activeAccountId,
        isJournaled: { $ne: true },
      })
        .sort({ exitTime: 1, _id: 1 })
        .session(session);

      // Update account lock and queue pointer.
      const account = await PropAccount.findById(user.activeAccountId).session(
        session,
      );

      if (!account) {
        throw new Error("Trading account not found.");
      }

      account.hasUnjournaledTrade = Boolean(nextPendingTrade);

      account.lastUnjournaledTradeId = nextPendingTrade?._id || null;

      await account.save({ session });

      result = {
        trade,
        account,
        remainingPendingTrade: nextPendingTrade,
      };
    });

    res.json({
      message: result.account.hasUnjournaledTrade
        ? "Journal submitted successfully. Another pending journal remains."
        : "Journal submitted successfully. Trading unlocked!",
      trade: result.trade,
      account: result.account,
      remainingPendingTrade: result.remainingPendingTrade,
    });
  } catch (error) {
    console.error("Error submitting journal:", error);

    const status =
      error.message === "Trade history record not found."
        ? 404
        : error.message === "This trade has already been journaled."
          ? 409
          : 500;

    res.status(status).json({ error: error.message });
  } finally {
    await session.endSession();
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
