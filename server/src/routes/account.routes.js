const express = require("express");
const router = express.Router();
const PropAccount = require("../models/PropAccount");
const User = require("../models/User");
const Position = require("../models/Position");
const marketPriceStore = require("../services/marketPriceStore");
const AccountActivity = require("../models/AccountActivity");
const TradeHistory = require("../models/TradeHistory");
const mongoose = require("mongoose");
const { calculateAccountRisk } = require("../services/riskCalculator");
const { getRiskPolicy } = require("../config/riskPolicy");

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

    const riskPolicy = getRiskPolicy(size);

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
    const isReset = Boolean(account);
    const previousAccountSize = account?.accountSize ?? null;
    if (account) {
      // Reset or update existing account
      account.accountSize = size;
      account.startingBalance = size;
      account.equitySessionId = new mongoose.Types.ObjectId();
      account.currentBalance = size;
      account.dailyStartingBalance = size;
      account.highWaterMark = size;
      account.dailyLossLimitPercent = riskPolicy.dailyLossLimitPercent;
      account.maxTrailingDrawdownPercent =
        riskPolicy.maxTrailingDrawdownPercent;
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
        // Tier-specific risk configuration
        dailyLossLimitPercent: riskPolicy.dailyLossLimitPercent,
        maxTrailingDrawdownPercent: riskPolicy.maxTrailingDrawdownPercent,
        equitySessionId: new mongoose.Types.ObjectId(),
      });
      user.activeAccountId = account._id;
      await user.save();
    }

    // Record account creation or reset activity.
    const activityData = {
      userId: user._id,
      accountId: account._id,

      eventType: isReset ? "ACCOUNT_RESET" : "ACCOUNT_CREATED",

      title: isReset ? "Trading Account Reset" : "Trading Account Created",

      description: isReset
        ? `Account reset from ₹${previousAccountSize.toLocaleString("en-IN")} to ₹${size.toLocaleString("en-IN")}.`
        : `New ₹${size.toLocaleString("en-IN")} trading account created.`,

      metadata: {
        previousAccountSize,
        accountSize: size,
        dailyLossLimitPercent: riskPolicy.dailyLossLimitPercent,
        maxDrawdownPercent: riskPolicy.maxTrailingDrawdownPercent,
      },

      occurredAt: new Date(),
    };

    try {
      await AccountActivity.create(activityData);
    } catch (activityError) {
      // Activity logging must not make a successful account reset
      // appear to have failed.
      console.error("Failed to record account activity:", activityError);
    }

    res.json({ message: "Account initialized successfully", account });
  } catch (error) {
    console.error("Error initializing account:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/accounts/activities/:firebaseUid
 * @desc Get recent activity history for a user
 */
router.get("/activities/:firebaseUid", async (req, res) => {
  try {
    const user = await User.findOne({
      firebaseUid: req.params.firebaseUid,
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    const requestedLimit = Number.parseInt(req.query.limit, 10);

    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 50)
      : 10;

    const activities = await AccountActivity.find({
      userId: user._id,
    })
      .sort({ occurredAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      activities,
      count: activities.length,
    });
  } catch (error) {
    console.error("Error fetching account activities:", error);

    res.status(500).json({
      error: "Failed to fetch account activities.",
    });
  }
});

/**
 * @route GET /api/accounts/equity-curve/:firebaseUid
 * @desc Get realized equity curve from closed trades
 */
router.get("/equity-curve/:firebaseUid", async (req, res) => {
  try {
    const user = await User.findOne({
      firebaseUid: req.params.firebaseUid,
    });

    if (!user || !user.activeAccountId) {
      return res.status(404).json({
        error: "No active account found.",
      });
    }

    const account = await PropAccount.findById(user.activeAccountId);

    if (!account) {
      return res.status(404).json({
        error: "Account not found.",
      });
    }

    const allowedRanges = ["1D", "1W", "1M", "ALL"];
    const range = String(req.query.range || "1D").toUpperCase();

    if (!allowedRanges.includes(range)) {
      return res.status(400).json({
        error: "Invalid equity curve timeframe.",
      });
    }

    const now = new Date();
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

    let startDate = null;

    if (range === "1D") {
      // Start of today in India timezone.
      const istDate = new Date(now.getTime() + IST_OFFSET_MS);

      startDate = new Date(
        Date.UTC(
          istDate.getUTCFullYear(),
          istDate.getUTCMonth(),
          istDate.getUTCDate(),
        ) - IST_OFFSET_MS,
      );
    } else if (range === "1W") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === "1M") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const query = {
      accountId: account._id,
      equitySessionId: account.equitySessionId,
      balanceAfter: { $ne: null },
    };

    if (startDate) {
      query.exitTime = { $gte: startDate, $lte: now };
    }

    const trades = await TradeHistory.find(query)
      .select(
        "_id symbol netPnL balanceAfter exitPrice quantity exitTime exitReason",
      )
      .sort({ exitTime: 1, _id: 1 })
      .lean();

    const points = trades.map((trade) => ({
      tradeId: trade._id,
      symbol: trade.symbol,
      exitTime: trade.exitTime,
      netPnL: trade.netPnL,
      balanceAfter: trade.balanceAfter,
      quantity: trade.quantity,
      exitPrice: trade.exitPrice,
      exitReason: trade.exitReason,
    }));

    const totalRealizedPnL = trades.reduce(
      (total, trade) => total + Number(trade.netPnL || 0),
      0,
    );

    res.json({
      range,
      account: {
        accountId: account._id,
        equitySessionId: account.equitySessionId,
        startingBalance: account.startingBalance,
      },
      summary: {
        closedTrades: points.length,
        realizedPnL: totalRealizedPnL,
      },
      points,
    });
  } catch (error) {
    console.error("Error fetching equity curve:", error);

    res.status(500).json({
      error: "Failed to fetch equity curve.",
    });
  }
});

/**
 * @route   GET /api/accounts/:userId
 * @desc    Get active account details and drawdown metrics
 */

router.get("/:firebaseUid", async (req, res) => {
  try {
    const user = await User.findOne({
      firebaseUid: req.params.firebaseUid,
    });

    if (!user || !user.activeAccountId) {
      return res.status(404).json({
        error: "No active account found for user.",
      });
    }

    const account = await PropAccount.findById(user.activeAccountId);

    if (!account) {
      return res.status(404).json({
        error: "Account not found.",
      });
    }

    // Fetch all open positions for this account.
    const positions = await Position.find({
      accountId: account._id,
    })
      .select("symbol averageEntryPrice quantity")
      .lean();

    // Get fresh prices for every open position.
    const symbols = positions.map((position) => position.symbol);

    const { currentPrices, missingSymbols, staleSymbols } =
      marketPriceStore.getPriceSnapshot(symbols);

    // Do not calculate or display incomplete risk metrics.
    if (missingSymbols.length > 0 || staleSymbols.length > 0) {
      return res.json({
        account,
        metrics: null,
        marketData: {
          available: false,
          missingSymbols,
          staleSymbols,
        },
      });
    }

    // Calculate total unrealized P&L using actual quantity.
    const totalUnrealizedPnL = positions.reduce((total, position) => {
      const ltp = Number(currentPrices[position.symbol]);
      const entryPrice = Number(position.averageEntryPrice);
      const quantity = Number(position.quantity);

      if (
        !Number.isFinite(ltp) ||
        !Number.isFinite(entryPrice) ||
        !Number.isFinite(quantity) ||
        ltp <= 0 ||
        entryPrice <= 0 ||
        quantity <= 0
      ) {
        throw new Error(`Invalid position valuation for ${position.symbol}`);
      }

      return total + (ltp - entryPrice) * quantity;
    }, 0);

    // Use the same risk calculator as the Risk Watchdog.
    const risk = calculateAccountRisk(account, totalUnrealizedPnL);

    res.json({
      account,

      metrics: {
        ...risk,

        // Maintain compatibility with existing metric consumers.
        currentDrawdownAmount: risk.trailingDrawdown.currentDrawdownAmount,

        currentDrawdownPercent: Number(
          risk.trailingDrawdown.currentDrawdownPercent.toFixed(2),
        ),

        dailyPnL: risk.daily.pnl,

        dailyPnLPercent: Number(risk.daily.pnlPercent.toFixed(2)),
      },

      marketData: {
        available: true,
        positionsCount: positions.length,
      },
    });
  } catch (error) {
    console.error("Error fetching account:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

module.exports = router;
