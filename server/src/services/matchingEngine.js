const Order = require("../models/Order");
const Position = require("../models/Position");
const PropAccount = require("../models/PropAccount");
const TradeHistory = require("../models/TradeHistory");
const mongoose = require("mongoose");

function createOrderError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

class MatchingEngine {
  async placeOrder(accountId, orderData, currentTickPrice, currentGreeks) {
    const account = await PropAccount.findById(accountId);
    if (!account) throw new Error("Account not found");
    if (account.status === "BREACHED")
      throw createOrderError("Account is breached. Trading is locked.", 403);

    // Validate incoming order data
    if (!orderData || typeof orderData !== "object") {
      throw createOrderError("Invalid order data.", 400);
    }

    const {
      symbol,
      underlying,
      strikePrice,
      optionType,
      expiryDate,
      side,
      orderType,
      quantity,
      lotSize,
      limitPrice,
      triggerPrice,
    } = orderData;

    // Validate underlying
    const expectedLotSizes = {
      NIFTY: 75,
      BANKNIFTY: 30,
    };

    if (!expectedLotSizes[underlying]) {
      throw createOrderError("Invalid underlying symbol.", 400);
    }

    // Validate lot size
    if (Number(lotSize) !== expectedLotSizes[underlying]) {
      throw createOrderError("Invalid lot size for selected underlying.", 400);
    }

    // Validate quantity
    const lots = Number(quantity);

    if (!Number.isInteger(lots) || lots <= 0) {
      throw createOrderError("Order quantity must be a positive integer.", 400);
    }

    // Validate contract details
    if (
      typeof symbol !== "string" ||
      !symbol.startsWith(underlying) ||
      !symbol.endsWith(optionType)
    ) {
      throw createOrderError("Invalid option contract symbol.", 400);
    }

    if (!Number.isFinite(Number(strikePrice)) || Number(strikePrice) <= 0) {
      throw createOrderError("Invalid strike price.", 400);
    }

    if (!["CE", "PE"].includes(optionType)) {
      throw createOrderError("Invalid option type.", 400);
    }

    if (typeof expiryDate !== "string" || !expiryDate.trim()) {
      throw createOrderError("Expiry date is required.", 400);
    }

    // Validate transaction side
    if (!["BUY", "SELL"].includes(side)) {
      throw createOrderError("Invalid order side.", 400);
    }

    // Journal lock blocks only new BUY entries.
    // Existing positions must remain closable.
    if (side === "BUY" && account.hasUnjournaledTrade) {
      throw createOrderError(
        "Trading Locked: Complete your mandatory journal before opening a new position.",
        403,
      );
    }

    // Validate order type
    if (!["MARKET", "LIMIT", "SL"].includes(orderType)) {
      throw createOrderError("Unsupported order type.", 400);
    }

    // Validate LIMIT price
    if (orderType === "LIMIT") {
      if (!Number.isFinite(Number(limitPrice)) || Number(limitPrice) <= 0) {
        throw createOrderError("A valid limit price is required.", 400);
      }
    }

    // Validate STOP-LOSS trigger
    if (orderType === "SL") {
      if (!Number.isFinite(Number(triggerPrice)) || Number(triggerPrice) <= 0) {
        throw createOrderError(
          "A valid stop-loss trigger price is required.",
          400,
        );
      }
    }

    const totalQuantity = lots * Number(lotSize);

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
      try {
        return await this.executeOrder(order, currentTickPrice, currentGreeks);
      } catch (error) {
        await Order.updateOne(
          {
            _id: order._id,
            status: "PENDING",
          },
          {
            $set: {
              status: "REJECTED",
              rejectionReason: error.message,
            },
          },
        );

        throw error;
      }
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

  async executeOrder(order, executionPrice, currentGreeks = {}) {
    const price = Number(executionPrice);

    if (!Number.isFinite(price) || price <= 0) {
      throw new Error("Invalid execution price.");
    }

    const session = await mongoose.startSession();

    let committedResult = null;

    try {
      await session.withTransaction(async () => {
        // Reset result because transaction callbacks can retry.
        committedResult = null;

        // Atomically claim this pending order.
        const claimedOrder = await Order.findOneAndUpdate(
          {
            _id: order._id,
            status: "PENDING",
          },
          {
            $set: { status: "PROCESSING" },
          },
          {
            returnDocument: "after",
            session,
          },
        );

        // Another process may already have executed this order.
        if (!claimedOrder) {
          committedResult = { executed: false };
          return;
        }

        // Fetch account inside the transaction.
        const account = await PropAccount.findById(
          claimedOrder.accountId,
        ).session(session);

        if (!account) {
          throw new Error("Trading account not found.");
        }

        // Reject every order if the account has been breached.
        if (account.status === "BREACHED") {
          const reason = "Account is breached. All trading orders are locked.";

          claimedOrder.status = "REJECTED";
          claimedOrder.rejectionReason = reason;

          await claimedOrder.save({ session });

          committedResult = {
            executed: false,
            rejected: true,
            order: claimedOrder,
          };

          return;
        }

        // Reject BUY orders if mandatory journaling is pending.
        // SELL orders are always allowed to close existing positions.
        if (claimedOrder.side === "BUY" && account.hasUnjournaledTrade) {
          const reason =
            "Trading Locked: Complete your mandatory journal before opening a new position.";

          claimedOrder.status = "REJECTED";
          claimedOrder.rejectionReason = reason;

          await claimedOrder.save({ session });

          committedResult = {
            executed: false,
            rejected: true,
            order: claimedOrder,
          };

          return;
        }

        let tradeHistory = null;
        let netPnL = null;

        // BUY: Open or increase a long option position.
        if (claimedOrder.side === "BUY") {
          const position = await Position.findOne({
            accountId: claimedOrder.accountId,
            symbol: claimedOrder.symbol,
          }).session(session);

          if (position) {
            const totalCost =
              position.quantity * position.averageEntryPrice +
              claimedOrder.quantity * price;

            position.quantity += claimedOrder.quantity;
            position.averageEntryPrice = totalCost / position.quantity;

            await position.save({ session });
          } else {
            const newPosition = new Position({
              accountId: claimedOrder.accountId,
              symbol: claimedOrder.symbol,
              underlying: claimedOrder.underlying,
              strikePrice: claimedOrder.strikePrice,
              optionType: claimedOrder.optionType,
              expiryDate: claimedOrder.expiryDate,
              quantity: claimedOrder.quantity,
              lotSize: claimedOrder.lotSize,
              averageEntryPrice: price,
              entryGreeks: currentGreeks || {},
            });

            await newPosition.save({ session });
          }
        }

        // SELL: Reduce or close an existing long position.
        else if (claimedOrder.side === "SELL") {
          const position = await Position.findOne({
            accountId: claimedOrder.accountId,
            symbol: claimedOrder.symbol,
          }).session(session);

          if (!position) {
            throw new Error(
              `No open position found for ${claimedOrder.symbol}`,
            );
          }

          // Never silently reduce the requested exit quantity.
          if (claimedOrder.quantity > position.quantity) {
            throw new Error(
              `Requested exit quantity ${claimedOrder.quantity} exceeds open quantity ${position.quantity}.`,
            );
          }

          const exitQty = claimedOrder.quantity;
          const buyPrice = position.averageEntryPrice;

          if (!Number.isFinite(buyPrice) || buyPrice <= 0) {
            throw new Error("Invalid position average entry price.");
          }

          netPnL = (price - buyPrice) * exitQty;

          const pnlPercent = ((price - buyPrice) / buyPrice) * 100;

          // Update realized balance after this closed trade.
          account.currentBalance += netPnL;

          // Ensure older accounts have a session identifier.
          if (!account.equitySessionId) {
            account.equitySessionId = new mongoose.Types.ObjectId();
          }

          const balanceAfter = account.currentBalance;

          if (account.currentBalance > account.highWaterMark) {
            account.highWaterMark = account.currentBalance;
          }

          // Create closed-trade history inside the transaction.
          [tradeHistory] = await TradeHistory.create(
            [
              {
                accountId: claimedOrder.accountId,
                symbol: claimedOrder.symbol,
                underlying: claimedOrder.underlying,
                strikePrice: claimedOrder.strikePrice,
                optionType: claimedOrder.optionType,
                quantity: exitQty,
                entryPrice: buyPrice,
                exitPrice: price,
                equitySessionId: account.equitySessionId,
                balanceAfter,
                netPnL,
                pnlPercent,
                exitReason: "MANUAL_EXIT",
                entryTime: position.createdAt,
                exitTime: new Date(),
                isJournaled: false,
              },
            ],
            { session },
          );

          // Lock account for mandatory journaling.
          // Always point to the oldest pending journal.
          const oldestPendingTrade = await TradeHistory.findOne({
            accountId: claimedOrder.accountId,
            isJournaled: { $ne: true },
          })
            .sort({ exitTime: 1, _id: 1 })
            .session(session);

          account.hasUnjournaledTrade = Boolean(oldestPendingTrade);

          account.lastUnjournaledTradeId = oldestPendingTrade?._id || null;

          await account.save({ session });

          await account.save({ session });

          // Update or remove the position.
          if (position.quantity === exitQty) {
            await Position.deleteOne({ _id: position._id }, { session });
          } else {
            position.quantity -= exitQty;
            await position.save({ session });
          }
        } else {
          throw new Error("Unsupported order side.");
        }

        // Only mark EXECUTED after every operation succeeds.
        claimedOrder.status = "EXECUTED";
        claimedOrder.executedPrice = price;
        claimedOrder.executedAt = new Date();

        await claimedOrder.save({ session });

        committedResult = {
          executed: true,
          order: claimedOrder,
          tradeHistory,
          netPnL,
        };
      });

      if (committedResult?.rejected) {
        throw createOrderError(committedResult.order.rejectionReason, 403);
      }

      // Everything above has committed successfully at this point.
      if (!committedResult?.executed) {
        const latestOrder = await Order.findById(order._id);

        return {
          message: "Order is already processed or no longer pending.",
          order: latestOrder,
        };
      }

      // Socket events must happen AFTER transaction commit.
      this.emitOrderExecuted(committedResult.order);

      if (committedResult.tradeHistory && global.io) {
        global.io
          .of("/trading")
          .to(order.accountId.toString())
          .emit("trading_locked", {
            accountId: order.accountId,
            tradeId: committedResult.tradeHistory._id,
            message: "Trading locked. Mandatory post-trade journal required.",
          });
      }

      if (committedResult.tradeHistory) {
        return {
          message: "Position exited successfully",
          netPnL: committedResult.netPnL,
          tradeHistory: committedResult.tradeHistory,
          order: committedResult.order,
        };
      }

      return {
        message: "Order executed",
        order: committedResult.order,
      };
    } finally {
      await session.endSession();
    }
  }
}

module.exports = new MatchingEngine();
