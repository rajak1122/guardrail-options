const Order = require("../models/Order");
const Position = require("../models/Position");
const PropAccount = require("../models/PropAccount");
const TradeHistory = require("../models/TradeHistory");

class MatchingEngine {
  /**
   * Place a new order and execute it immediately if it's a MARKET order
   */
  async placeOrder(accountId, orderData, currentTickPrice, currentGreeks) {
    const account = await PropAccount.findById(accountId);
    if (!account) throw new Error("Account not found");
    if (account.status === "BREACHED")
      throw new Error("Account is breached. Trading is locked.");

    // Enforce Journal Discipline Gate: Check if user has an unjournaled closed trade
    if (account.hasUnjournaledTrade) {
      throw new Error(
        "Trading Locked: You must complete your mandatory post-trade journal for your last closed trade before placing new orders.",
      );
    }

    const totalQuantity = orderData.quantity * orderData.lotSize;

    // Create Order record
    const order = await Order.create({
      accountId,
      symbol: orderData.symbol,
      underlying: orderData.underlying,
      strikePrice: orderData.strikePrice,
      optionType: orderData.optionType,
      expiryDate: orderData.expiryDate,
      side: orderData.side,
      orderType: orderData.orderType,
      quantity: totalQuantity,
      lotSize: orderData.lotSize,
      limitPrice: orderData.limitPrice || null,
      triggerPrice: orderData.triggerPrice || null,
      status: "PENDING",
    });

    // If Market Order, execute instantly
    if (order.orderType === "MARKET") {
      return await this.executeOrder(order, currentTickPrice, currentGreeks);
    }

    return { message: "Order placed successfully as PENDING", order };
  }

  async executeOrder(order, executionPrice, currentGreeks) {
    order.status = "EXECUTED";
    order.executedPrice = executionPrice;
    order.executedAt = new Date();
    await order.save();

    if (order.side === "BUY") {
      // Open or add to a long options position
      let position = await Position.findOne({
        accountId: order.accountId,
        symbol: order.symbol,
      });

      if (position) {
        // Average out entry price
        const totalCost =
          position.quantity * position.averageEntryPrice +
          order.quantity * executionPrice;
        position.quantity += order.quantity;
        position.averageEntryPrice = totalCost / position.quantity;
        await position.save();
      } else {
        await Position.create({
          accountId: order.accountId,
          symbol: order.symbol,
          underlying: order.underlying,
          strikePrice: order.strikePrice,
          optionType: order.optionType,
          expiryDate: order.expiryDate,
          quantity: order.quantity,
          lotSize: order.lotSize,
          averageEntryPrice: executionPrice,
          entryGreeks: currentGreeks || {},
        });
      }
    } else if (order.side === "SELL") {
      // Exit/reduce position
      const position = await Position.findOne({
        accountId: order.accountId,
        symbol: order.symbol,
      });

      if (!position)
        throw new Error(
          "No open position found to exit for symbol: " + order.symbol,
        );

      const exitQty = Math.min(order.quantity, position.quantity);
      const buyPrice = position.averageEntryPrice;
      const netPnL = (executionPrice - buyPrice) * exitQty;
      const pnlPercent = ((executionPrice - buyPrice) / buyPrice) * 100;

      // Update account cash balance
      const account = await PropAccount.findById(order.accountId);
      account.currentBalance += netPnL;

      // Update high water mark if equity increased
      if (account.currentBalance > account.highWaterMark) {
        account.highWaterMark = account.currentBalance;
      }

      // Record Trade History & trigger mandatory journal lock
      const tradeHistory = await TradeHistory.create({
        accountId: order.accountId,
        symbol: order.symbol,
        underlying: order.underlying,
        strikePrice: order.strikePrice,
        optionType: order.optionType,
        quantity: exitQty,
        entryPrice: buyPrice,
        exitPrice: executionPrice,
        netPnL,
        pnlPercent,
        exitReason: "MANUAL_EXIT",
        entryTime: position.createdAt,
        exitTime: new Date(),
        isJournaled: false,
      });

      // Lock account for journaling
      account.hasUnjournaledTrade = true;
      account.lastUnjournaledTradeId = tradeHistory._id;
      await account.save();

      // Reduce or remove position
      if (position.quantity <= exitQty) {
        await Position.deleteOne({ _id: position._id });
      } else {
        position.quantity -= exitQty;
        await position.save();
      }

      return { message: "Position exited successfully", netPnL, tradeHistory };
    }

    return { message: "Order executed", order };
  }
}

module.exports = new MatchingEngine();
