const mongoose = require("mongoose");

const PropAccount = require("../models/PropAccount");
const Position = require("../models/Position");
const TradeHistory = require("../models/TradeHistory");
const Order = require("../models/Order");
const AccountActivity = require("../models/AccountActivity");

const { calculateAccountRisk } = require("./riskCalculator");

class RiskWatchdog {
  /**
   * Evaluates real-time risk for an account against current market prices
   * @param {string} accountId
   * @param {object} currentPrices - Map of symbol -> current LTP (e.g., { 'NIFTY23500CE': 145.50 })
   */

  async evaluateAccountRisk(accountId, currentPrices = {}) {
    const account = await PropAccount.findById(accountId);

    if (!account || account.status === "BREACHED") {
      return { evaluated: false, reason: "ACCOUNT_UNAVAILABLE" };
    }

    // 1. Fetch all open positions.
    const positions = await Position.find({ accountId });

    // 2. Calculate floating P&L.
    let totalUnrealizedPnL = 0;
    const missingSymbols = [];

    for (const pos of positions) {
      const rawLTP = currentPrices?.[pos.symbol];
      const currentLTP = Number(rawLTP);

      // Never silently use entry price when market data is missing.
      if (
        rawLTP === undefined ||
        rawLTP === null ||
        !Number.isFinite(currentLTP) ||
        currentLTP <= 0
      ) {
        missingSymbols.push(pos.symbol);
        continue;
      }

      const tradePnL = (currentLTP - pos.averageEntryPrice) * pos.quantity;

      totalUnrealizedPnL += tradePnL;
    }

    // An incomplete market valuation must not be treated as safe.
    if (missingSymbols.length > 0) {
      console.warn(
        `Risk evaluation skipped for account ${accountId}. Missing prices:`,
        missingSymbols,
      );

      return {
        evaluated: false,
        reason: "MISSING_POSITION_PRICES",
        missingSymbols,
      };
    }

    // 3. Use the shared risk calculator.
    let risk = calculateAccountRisk(account, totalUnrealizedPnL);

    // 4. Update High-Water Mark when equity reaches a new peak.
    if (risk.currentEquity > account.highWaterMark) {
      account.highWaterMark = risk.currentEquity;
      await account.save();

      // Recalculate using the updated high-water mark.
      risk = calculateAccountRisk(account, totalUnrealizedPnL);
    }

    // 5. Evaluate daily loss and trailing drawdown.
    let breachReason = null;
    let breachMessage = null;

    if (risk.daily.breached) {
      breachReason = "DAILY_LOSS_LIMIT_EXCEEDED";

      breachMessage =
        `Daily loss limit of ${account.dailyLossLimitPercent}% breached. ` +
        `Allowed loss: ₹${risk.daily.allowedLossAmount.toLocaleString("en-IN")}`;
    } else if (risk.trailingDrawdown.breached) {
      breachReason = "MAX_TRAILING_DRAWDOWN_EXCEEDED";

      breachMessage =
        `Maximum drawdown of ${account.maxTrailingDrawdownPercent}% breached. ` +
        `Fixed equity floor: ₹${risk.trailingDrawdown.maxDrawdownFloor.toLocaleString("en-IN")}`;
    }
    // 6. Trigger liquidation when a rule is breached.
    if (breachReason) {
      const breachResult = await this.triggerAccountBreach(
        account,
        positions,
        currentPrices,
        breachReason,
        breachMessage,
      );

      return {
        ...breachResult,
        risk: breachResult?.risk || risk,
      };
    }

    return {
      evaluated: true,
      breached: false,
      risk,
    };
  }

  /**
   * Triggers account breach, liquidates open positions, and logs risk liquidation trades
   */

  async triggerAccountBreach(
    account,
    positions,
    currentPrices,
    breachReason,
    breachMessage,
  ) {
    const session = await mongoose.startSession();

    let committedResult = null;

    try {
      await session.withTransaction(async () => {
        // Transaction callbacks can retry.
        committedResult = null;

        // Always fetch the latest account state.
        const freshAccount = await PropAccount.findOne({
          _id: account._id,
          status: "ACTIVE",
        }).session(session);

        // Another process may already have breached this account.
        if (!freshAccount) {
          committedResult = {
            evaluated: false,
            breached: false,
            reason: "ACCOUNT_ALREADY_BREACHED_OR_UNAVAILABLE",
          };
          return;
        }

        // Fetch positions again inside the transaction.
        const openPositions = await Position.find({
          accountId: freshAccount._id,
        })
          .sort({ createdAt: 1, _id: 1 })
          .session(session);

        let totalUnrealizedPnL = 0;
        const liquidationRecords = [];
        const breachTime = new Date();
        let balanceAfter = Number(freshAccount.currentBalance);

        if (!Number.isFinite(balanceAfter)) {
          throw new Error("Invalid account balance during liquidation.");
        }

        if (!freshAccount.equitySessionId) {
          freshAccount.equitySessionId = new mongoose.Types.ObjectId();
        }

        // Validate and calculate every open position.
        for (const pos of openPositions) {
          const rawPrice = currentPrices?.[pos.symbol];
          const liquidationPrice = Number(rawPrice);

          if (
            rawPrice === undefined ||
            rawPrice === null ||
            !Number.isFinite(liquidationPrice) ||
            liquidationPrice <= 0
          ) {
            committedResult = {
              evaluated: false,
              breached: false,
              reason: "MISSING_POSITION_PRICES",
              missingSymbol: pos.symbol,
            };
            return;
          }

          const entryPrice = Number(pos.averageEntryPrice);

          if (!Number.isFinite(entryPrice) || entryPrice <= 0) {
            throw new Error(`Invalid average entry price for ${pos.symbol}`);
          }

          const quantity = Number(pos.quantity);

          if (!Number.isFinite(quantity) || quantity <= 0) {
            throw new Error(`Invalid open quantity for ${pos.symbol}`);
          }

          const netPnL = (liquidationPrice - entryPrice) * quantity;

          const pnlPercent =
            ((liquidationPrice - entryPrice) / entryPrice) * 100;

          totalUnrealizedPnL += netPnL;

          // Track the realized balance after each liquidation.
          balanceAfter += netPnL;

          liquidationRecords.push({
            balanceAfter,
            equitySessionId: freshAccount.equitySessionId,
            accountId: freshAccount._id,
            symbol: pos.symbol,
            underlying: pos.underlying,
            strikePrice: pos.strikePrice,
            optionType: pos.optionType,
            quantity,
            entryPrice,
            exitPrice: liquidationPrice,
            netPnL,
            pnlPercent,
            exitReason: "RISK_BREACH_LIQUIDATION",
            entryTime: pos.createdAt || breachTime,
            exitTime: breachTime,
            isJournaled: false,
          });
        }

        // Recalculate risk using fresh account and position data.
        let risk = calculateAccountRisk(freshAccount, totalUnrealizedPnL);

        // Preserve the highest recorded equity.
        if (risk.currentEquity > freshAccount.highWaterMark) {
          freshAccount.highWaterMark = risk.currentEquity;

          risk = calculateAccountRisk(freshAccount, totalUnrealizedPnL);
        }

        // Confirm the breach again inside the transaction.
        let confirmedReason = null;
        let confirmedMessage = null;

        if (risk.daily.breached) {
          confirmedReason = "DAILY_LOSS_LIMIT_EXCEEDED";

          confirmedMessage =
            `Daily loss limit of ${freshAccount.dailyLossLimitPercent}% breached. ` +
            `Allowed loss: ₹${risk.daily.allowedLossAmount.toLocaleString("en-IN")}`;
        } else if (risk.trailingDrawdown.breached) {
          confirmedReason = "MAX_TRAILING_DRAWDOWN_EXCEEDED";

          confirmedMessage =
            `Maximum drawdown of ${freshAccount.maxTrailingDrawdownPercent}% breached. ` +
            `Fixed equity floor: ₹${risk.trailingDrawdown.maxDrawdownFloor.toLocaleString("en-IN")}`;
        }

        // The original breach may no longer be valid
        // if the account changed between evaluation and liquidation.
        if (!confirmedReason) {
          if (freshAccount.isModified("highWaterMark")) {
            await freshAccount.save({ session });
          }

          committedResult = {
            evaluated: true,
            breached: false,
            reason: "RISK_NO_LONGER_BREACHED",
            risk,
          };

          return;
        }

        console.log(
          `🚨 ACCOUNT BREACH DETECTED [${freshAccount._id}]: ${confirmedReason}`,
        );

        // Record the breach.
        freshAccount.status = "BREACHED";
        freshAccount.breachReason = confirmedReason;
        freshAccount.breachedAt = breachTime;

        // Final balance after all automatic liquidations.
        freshAccount.currentBalance = balanceAfter;

        // Create all liquidation histories atomically.
        let createdTrades = [];

        if (liquidationRecords.length > 0) {
          createdTrades = await TradeHistory.create(liquidationRecords, {
            session,
          });
        }

        // Remove all positions belonging to this account.
        await Position.deleteMany({ accountId: freshAccount._id }, { session });

        // Reject orders that were still pending.
        await Order.updateMany(
          {
            accountId: freshAccount._id,
            status: "PENDING",
          },
          {
            $set: {
              status: "REJECTED",
              rejectionReason: "Account breached. Trading is locked.",
            },
          },
          { session },
        );

        // Maintain the mandatory journal queue.
        const oldestPendingTrade = await TradeHistory.findOne({
          accountId: freshAccount._id,
          isJournaled: { $ne: true },
        })
          .sort({ exitTime: 1, _id: 1 })
          .session(session);

        freshAccount.hasUnjournaledTrade = Boolean(oldestPendingTrade);

        freshAccount.lastUnjournaledTradeId = oldestPendingTrade?._id || null;

        await freshAccount.save({ session });

        // Record account breach activity in the same transaction.
        await AccountActivity.create(
          [
            {
              userId: freshAccount.userId,
              accountId: freshAccount._id,

              eventType: "ACCOUNT_BREACHED",

              title: "Trading Account Breached",

              description: confirmedMessage || confirmedReason,

              metadata: {
                breachReason: confirmedReason,
                liquidatedPositions: liquidationRecords.length,
                dailyLossLimitPercent: freshAccount.dailyLossLimitPercent,
                maxDrawdownPercent: freshAccount.maxTrailingDrawdownPercent,
                fixedEquityFloor: risk.trailingDrawdown.maxDrawdownFloor,
              },

              occurredAt: breachTime,
            },
          ],
          { session },
        );

        committedResult = {
          evaluated: true,
          breached: true,
          breachReason: confirmedReason,
          breachMessage: confirmedMessage,
          breachedAt: breachTime,
          liquidatedPositions: liquidationRecords.length,
          liquidationTradeIds: createdTrades.map((trade) =>
            trade._id.toString(),
          ),
          risk,
        };
      });

      // Socket notification only after successful transaction commit.
      if (committedResult?.breached) {
        const tradingNamespace = global.io?.of("/trading");

        tradingNamespace?.to(account._id.toString()).emit("account_breached", {
          accountId: account._id,
          reason: committedResult.breachReason,
          message: committedResult.breachMessage,
          breachedAt: committedResult.breachedAt,
          liquidatedPositions: committedResult.liquidatedPositions,
          liquidationTradeIds: committedResult.liquidationTradeIds,
        });
      }

      return committedResult;
    } finally {
      await session.endSession();
    }
  }
}

module.exports = new RiskWatchdog();
