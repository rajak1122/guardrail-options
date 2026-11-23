const express = require("express");
const router = express.Router();
const TradeHistory = require("../models/TradeHistory");
const PropAccount = require("../models/PropAccount");
const User = require("../models/User");
const AccountActivity = require("../models/AccountActivity");
const mongoose = require("mongoose");

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

      // Persist journal submission activity in the same transaction.
      await AccountActivity.create(
        [
          {
            userId: user._id,
            accountId: user.activeAccountId,

            eventType: "JOURNAL_SUBMITTED",

            title: "Trade Journal Submitted",

            description: `${trade.symbol} journal completed successfully.`,

            metadata: {
              tradeId: trade._id,
              symbol: trade.symbol,
              netPnL: trade.netPnL,
              setupTag: trade.journal.setupTag,
              remainingPendingTrade: Boolean(nextPendingTrade),
            },

            occurredAt: trade.journal.submittedAt,
          },
        ],
        { session },
      );

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
    const { firebaseUid } = req.params;
    const range = String(req.query.range || "ALL").toUpperCase();

    const allowedRanges = ["1D", "1W", "1M", "ALL"];

    if (!allowedRanges.includes(range)) {
      return res.status(400).json({
        error: "Invalid range. Use 1D, 1W, 1M or ALL.",
      });
    }

    const round2 = (value) => Number(value.toFixed(2));

    const summarize = (items) => {
      let winningTrades = 0;
      let losingTrades = 0;
      let breakevenTrades = 0;
      let grossProfit = 0;
      let grossLoss = 0;

      items.forEach((trade) => {
        const pnl = Number(trade.netPnL) || 0;

        if (pnl > 0) {
          winningTrades++;
          grossProfit += pnl;
        } else if (pnl < 0) {
          losingTrades++;
          grossLoss += Math.abs(pnl);
        } else {
          breakevenTrades++;
        }
      });

      const totalTrades = items.length;
      const netPnL = grossProfit - grossLoss;

      return {
        totalTrades,
        winningTrades,
        losingTrades,
        breakevenTrades,
        winRate:
          totalTrades > 0 ? round2((winningTrades / totalTrades) * 100) : 0,
        grossProfit: round2(grossProfit),
        grossLoss: round2(grossLoss),
        netPnL: round2(netPnL),
        profitFactor:
          grossLoss > 0
            ? round2(grossProfit / grossLoss)
            : grossProfit > 0
              ? null
              : 0,
        averageWin: winningTrades > 0 ? round2(grossProfit / winningTrades) : 0,
        averageLoss: losingTrades > 0 ? round2(grossLoss / losingTrades) : 0,
        expectancy: totalTrades > 0 ? round2(netPnL / totalTrades) : 0,
      };
    };

    const user = await User.findOne({ firebaseUid });

    if (!user || !user.activeAccountId) {
      return res.json({
        range,
        scope: "CURRENT_SESSION",
        ...summarize([]),
        discipline: {
          trackedTrades: 0,
          followedPlanTrades: 0,
          notFollowedPlanTrades: 0,
          planFollowRate: 0,
        },
        setupPerformance: [],
        emotionPerformance: [],
        dailyPerformance: [],
      });
    }

    const account = await PropAccount.findById(user.activeAccountId).select(
      "equitySessionId",
    );

    if (!account) {
      return res.status(404).json({
        error: "Trading account not found.",
      });
    }

    // Current account session only.
    const tradeFilter = {
      accountId: user.activeAccountId,
      isJournaled: true,
    };

    if (account.equitySessionId) {
      tradeFilter.equitySessionId = account.equitySessionId;
    }

    // Apply requested time range.
    const now = new Date();
    const IST_OFFSET_MS = 330 * 60 * 1000;

    if (range === "1D") {
      const istNow = new Date(now.getTime() + IST_OFFSET_MS);

      const istMidnight = Date.UTC(
        istNow.getUTCFullYear(),
        istNow.getUTCMonth(),
        istNow.getUTCDate(),
      );

      tradeFilter.exitTime = {
        $gte: new Date(istMidnight - IST_OFFSET_MS),
      };
    } else if (range === "1W") {
      tradeFilter.exitTime = {
        $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      };
    } else if (range === "1M") {
      tradeFilter.exitTime = {
        $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      };
    }

    const trades = await TradeHistory.find(tradeFilter)
      .sort({ exitTime: 1, _id: 1 })
      .lean();

    const overview = summarize(trades);

    // Discipline metrics.
    const trackedTrades = trades.filter(
      (trade) => typeof trade.journal?.followedPlan === "boolean",
    );

    const followedPlanTrades = trackedTrades.filter(
      (trade) => trade.journal.followedPlan === true,
    ).length;

    const notFollowedPlanTrades = trackedTrades.length - followedPlanTrades;

    const discipline = {
      trackedTrades: trackedTrades.length,
      followedPlanTrades,
      notFollowedPlanTrades,
      planFollowRate:
        trackedTrades.length > 0
          ? round2((followedPlanTrades / trackedTrades.length) * 100)
          : 0,
    };

    // Setup and emotion performance.
    const buildBreakdown = (field) => {
      const groups = new Map();

      trades.forEach((trade) => {
        const key = trade.journal?.[field] || "UNSET";

        if (!groups.has(key)) {
          groups.set(key, []);
        }

        groups.get(key).push(trade);
      });

      return Array.from(groups.entries())
        .map(([tag, items]) => ({
          tag,
          ...summarize(items),
        }))
        .sort((a, b) => b.totalTrades - a.totalTrades);
    };

    const setupPerformance = buildBreakdown("setupTag");
    const emotionPerformance = buildBreakdown("emotionTag");

    // Daily realized P&L, grouped by IST date.
    const dailyMap = new Map();

    trades.forEach((trade) => {
      const exitDate = new Date(trade.exitTime);
      const istDate = new Date(exitDate.getTime() + IST_OFFSET_MS);

      const date = istDate.toISOString().slice(0, 10);

      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          totalTrades: 0,
          netPnL: 0,
        });
      }

      const day = dailyMap.get(date);

      day.totalTrades++;
      day.netPnL += Number(trade.netPnL) || 0;
    });

    const dailyPerformance = Array.from(dailyMap.values())
      .map((day) => ({
        ...day,
        netPnL: round2(day.netPnL),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      range,
      scope: "CURRENT_SESSION",
      sessionId: account.equitySessionId || null,
      ...overview,
      discipline,
      setupPerformance,
      emotionPerformance,
      dailyPerformance,
    });
  } catch (error) {
    console.error("Journal analytics error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

module.exports = router;
