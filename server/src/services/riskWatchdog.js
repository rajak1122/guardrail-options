const PropAccount = require("../models/PropAccount");
const Position = require("../models/Position");
const TradeHistory = require("../models/TradeHistory");

class RiskWatchdog {
  /**
   * Evaluates real-time risk for an account against current market prices
   * @param {string} accountId
   * @param {object} currentPrices - Map of symbol -> current LTP (e.g., { 'NIFTY23500CE': 145.50 })
   */
  async evaluateAccountRisk(accountId, currentPrices) {
    const account = await PropAccount.findById(accountId);
    if (!account || account.status === "BREACHED") return;

    // 1. Fetch all open positions for this account
    const positions = await Position.find({ accountId });
    if (positions.length === 0) return;

    let totalUnrealizedPnL = 0;

    // 2. Calculate floating Unrealized P&L
    for (const pos of positions) {
      const currentLTP = currentPrices[pos.symbol] || pos.averageEntryPrice;
      const tradePnL = (currentLTP - pos.averageEntryPrice) * pos.quantity;
      totalUnrealizedPnL += tradePnL;
    }

    const currentTotalEquity = account.currentBalance + totalUnrealizedPnL;

    // 3. Update High-Water Mark if equity reaches a new peak
    if (currentTotalEquity > account.highWaterMark) {
      account.highWaterMark = currentTotalEquity;
      await account.save();
    }

    // 4. Check Rule 1: Daily Loss Limit (e.g., 2% drop from daily starting balance)
    const allowedDailyLossAmount =
      account.dailyStartingBalance * (account.dailyLossLimitPercent / 100);
    const currentDailyPnL = currentTotalEquity - account.dailyStartingBalance;

    if (currentDailyPnL <= -allowedDailyLossAmount) {
      await this.triggerAccountBreach(
        account,
        positions,
        currentPrices,
        "DAILY_LOSS_LIMIT_EXCEEDED",
        `Daily loss limit of ${account.dailyLossLimitPercent}% breached. Max allowed loss: ₹${allowedDailyLossAmount.toLocaleString("en-IN")}`,
      );
      return;
    }

    // 5. Check Rule 2: Max Trailing Drawdown (e.g., 5% drop from High-Water Mark based on account size)
    const allowedDrawdownAmount =
      account.accountSize * (account.maxTrailingDrawdownPercent / 100);
    const currentDrawdownFromPeak = account.highWaterMark - currentTotalEquity;

    if (currentDrawdownFromPeak >= allowedDrawdownAmount) {
      await this.triggerAccountBreach(
        account,
        positions,
        currentPrices,
        "MAX_TRAILING_DRAWDOWN_EXCEEDED",
        `Max trailing drawdown of ${account.maxTrailingDrawdownPercent}% breached from peak equity.`,
      );
      return;
    }
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
    console.log(`🚨 ACCOUNT BREACH DETECTED [${account._id}]: ${breachReason}`);

    account.status = "BREACHED";
    account.breachReason = breachReason;
    account.breachedAt = new Date();
    await account.save();

    // Liquidate all open positions at current market prices
    for (const pos of positions) {
      const liquidationPrice =
        currentPrices[pos.symbol] || pos.averageEntryPrice;
      const netPnL = (liquidationPrice - pos.averageEntryPrice) * pos.quantity;
      const pnlPercent =
        ((liquidationPrice - pos.averageEntryPrice) / pos.averageEntryPrice) *
        100;

      // Update cash balance
      account.currentBalance += netPnL;

      // Record Trade History with RISK_BREACH_LIQUIDATION exit reason
      await TradeHistory.create({
        accountId: account._id,
        symbol: pos.symbol,
        underlying: pos.underlying,
        strikePrice: pos.strikePrice,
        optionType: pos.optionType,
        quantity: pos.quantity,
        entryPrice: pos.averageEntryPrice,
        exitPrice: liquidationPrice,
        netPnL,
        pnlPercent,
        exitReason: "RISK_BREACH_LIQUIDATION",
        entryTime: pos.createdAt,
        exitTime: new Date(),
        isJournaled: false, // Will require journal or stay locked due to breach
      });

      // Remove open position
      await Position.deleteOne({ _id: pos._id });
    }

    await account.save();

    // Broadcast breach event via Socket.io if available
    if (global.io) {
      global.io.to(account._id.toString()).emit("account_breached", {
        accountId: account._id,
        reason: breachReason,
        message: breachMessage,
        breachedAt: account.breachedAt,
      });
    }
  }
}

module.exports = new RiskWatchdog();
