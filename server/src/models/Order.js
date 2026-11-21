const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PropAccount",
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true, // e.g., 'NIFTY23500CE'
    },
    underlying: {
      type: String,
      enum: ["NIFTY", "BANKNIFTY"],
      required: true,
    },
    strikePrice: {
      type: Number,
      required: true,
    },
    optionType: {
      type: String,
      enum: ["CE", "PE"],
      required: true,
    },
    expiryDate: {
      type: String,
      required: true, // e.g., '2026-11-19'
    },
    side: {
      type: String,
      enum: ["BUY", "SELL"], // BUY to open long option, SELL to exit long option
      required: true,
    },
    orderType: {
      type: String,
      enum: ["MARKET", "LIMIT", "SL"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true, // Total units (lots * lotSize, e.g., 2 lots * 75 = 150)
    },
    lotSize: {
      type: Number,
      required: true, // 75 for NIFTY, 30 for BANKNIFTY
    },
    limitPrice: {
      type: Number,
      default: null,
    },
    triggerPrice: {
      type: Number,
      default: null, // Used for SL orders
    },
    executedPrice: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "EXECUTED", "CANCELLED", "REJECTED"],
      default: "PENDING",
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    executedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
