const mongoose = require("mongoose");

const tradeHistorySchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PropAccount",
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
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
    quantity: {
      type: Number,
      required: true,
    },
    entryPrice: {
      type: Number,
      required: true,
    },
    exitPrice: {
      type: Number,
      required: true,
    },
    netPnL: {
      type: Number,
      required: true,
    },
    pnlPercent: {
      type: Number,
      required: true,
    },
    exitReason: {
      type: String,
      enum: [
        "MANUAL_EXIT",
        "STOP_LOSS",
        "TARGET_HIT",
        "RISK_BREACH_LIQUIDATION",
      ],
      default: "MANUAL_EXIT",
    },
    entryTime: {
      type: Date,
      required: true,
    },
    exitTime: {
      type: Date,
      default: Date.now,
    },
    // Mandatory Post-Trade Journal Fields
    isJournaled: {
      type: Boolean,
      default: false,
    },
    journal: {
      setupTag: {
        type: String,
        enum: [
          "ORB",
          "FVG_RETEST",
          "LIQUIDITY_SWEEP",
          "BREAK_OF_STRUCTURE",
          "MOMENTUM_SCALP",
          "IMPULSE_NO_SETUP",
        ],
        default: null,
      },
      emotionTag: {
        type: String,
        enum: [
          "CALM_DISCIPLINED",
          "FOMO",
          "REVENGE",
          "HESITANT",
          "OVERCONFIDENT",
        ],
        default: null,
      },
      followedPlan: {
        type: Boolean,
        default: null,
      },
      notes: {
        type: String,
        trim: true,
        default: "",
      },
      submittedAt: {
        type: Date,
        default: null,
      },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("TradeHistory", tradeHistorySchema);
