const mongoose = require("mongoose");

const propAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    accountSize: {
      type: Number,
      required: true,
      enum: [50000, 100000, 200000, 500000, 1000000], // 50k, 1L, 2L, 5L, 10L
      default: 500000, // Default to ₹5,00,000
    },
    startingBalance: {
      type: Number,
      required: true,
      default: 500000,
    },
    currentBalance: {
      type: Number,
      required: true,
      default: 500000, // Closed / realized equity
    },
    dailyStartingBalance: {
      type: Number,
      required: true,
      default: 500000, // Reset at 9:15 AM IST daily
    },
    highWaterMark: {
      type: Number,
      required: true,
      default: 500000, // Highest equity reached (for trailing drawdown)
    },
    // Risk Guardrails
    dailyLossLimitPercent: {
      type: Number,
      default: 2.0, // 2% max daily loss limit
    },
    maxTrailingDrawdownPercent: {
      type: Number,
      default: 10.0, // 10% max trailing drawdown limit
    },
    status: {
      type: String,
      enum: ["ACTIVE", "BREACHED"],
      default: "ACTIVE",
    },
    breachReason: {
      type: String,
      default: null, // e.g., 'DAILY_LOSS_LIMIT_EXCEEDED' or 'MAX_TRAILING_DRAWDOWN_EXCEEDED'
    },
    breachedAt: {
      type: Date,
      default: null,
    },
    // Mandatory Post-Trade Journal Gate
    hasUnjournaledTrade: {
      type: Boolean,
      default: false,
    },
    lastUnjournaledTradeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TradeHistory",
      default: null,
    },
    equitySessionId: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PropAccount", propAccountSchema);
