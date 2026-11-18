const Order = require("../models/Order");
const Position = require("../models/Position");
const PropAccount = require("../models/PropAccount");
const TradeHistory = require("../models/TradeHistory");

class MatchingEngine {
  async placeOrder(accountId, orderData, currentTickPrice, currentGreeks) {
    const account = await PropAccount.findById(accountId);
    if (!account) throw new Error("Account not found");
    if (account.status === "BREACHED")
      throw new Error("Account is breached. Trading is locked.");

    if (account.hasUnjournaledTrade) {
      throw new Error(
        "Trading Locked: You must complete your mandatory post-trade journal for your last closed trade before placing new orders.",
      );
    }

    const totalQuantity = orderData.quantity * orderData.lotSize;

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

    if (order.orderType === "MARKET") {
      return await this.executeOrder(order, currentTickPrice, currentGreeks);
    }

    return { message: "Order placed successfully as PENDING", order };
  }

  /**
   * Step 2.2: Evaluate incoming ticks against pending LIMIT, STOP-LOSS, and TARGET orders
   */
  async evaluatePendingOrders(currentPrices, currentGreeksMap) {
    const pendingOrders = await Order.find({ status: "PENDING" });
    for (const order of pendingOrders) {
      const ltp = currentPrices[order.symbol];
      if (!ltp) continue;

      let shouldExecute = false;
      if (
        order.orderType === "LIMIT" &&
        order.side === "BUY" &&
        ltp <= order.limitPrice
      ) {
        shouldExecute = true;
      } else if (order.orderType === "SL" && ltp <= order.triggerPrice) {
        shouldExecute = true;
      }

      if (shouldExecute) {
        const greeks = currentGreeksMap[order.symbol] || {};
        await this.executeOrder(order, ltp, greeks);
        console.log(`⚡ Pending order ${order._id} executed at LTP: ${ltp}`);
      }
    }
  }

  emitOrderExecuted(order) {
    const tradingNamespace = global.io?.of("/trading");

    if (!tradingNamespace) return;

    const accountRoom = order.accountId.toString();

    tradingNamespace.to(accountRoom).emit("order_executed", {
      orderId: order._id.toString(),
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      orderType: order.orderType,
      executedPrice: order.executedPrice,
      executedAt: order.executedAt,
      status: order.status,
    });

    console.log(`Order execution event emitted: ${order._id}`);
  }

  async executeOrder(order, executionPrice, currentGreeks) {
    order.status = "EXECUTED";
    order.executedPrice = executionPrice;
    order.executedAt = new Date();
    await order.save();

    if (order.side === "BUY") {
      let position = await Position.findOne({
        accountId: order.accountId,
        symbol: order.symbol,
      });

      if (position) {
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
      this.emitOrderExecuted(order);
    } else if (order.side === "SELL") {
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

      const account = await PropAccount.findById(order.accountId);
      account.currentBalance += netPnL;

      if (account.currentBalance > account.highWaterMark) {
        account.highWaterMark = account.currentBalance;
      }

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

      // Step 3.3: Push trading lock event over Socket.io
      if (global.io) {
        global.io
          .of("/trading")
          .to(order.accountId.toString())
          .emit("trading_locked", {
            accountId: order.accountId,
            tradeId: tradeHistory._id,
            message: "Trading locked. Mandatory post-trade journal required.",
          });
      }

      if (position.quantity <= exitQty) {
        await Position.deleteOne({ _id: position._id });
      } else {
        position.quantity -= exitQty;
        await position.save();
      }
      this.emitOrderExecuted(order);

      return { message: "Position exited successfully", netPnL, tradeHistory };
    }

    return { message: "Order executed", order };
  }
}

module.exports = new MatchingEngine();
