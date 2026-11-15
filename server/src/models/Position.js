const mongoose = require("mongoose");

const positionSchema = new mongoose.Schema(
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
    expiryDate: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    lotSize: {
      type: Number,
      required: true,
    },
    averageEntryPrice: {
      type: Number,
      required: true,
    },
    stopLossPrice: {
      type: Number,
      default: null,
    },
    targetPrice: {
      type: Number,
      default: null,
    },
    entrySpotPrice: {
      type: Number,
      default: null,
    },
    entryGreeks: {
      delta: Number,
      theta: Number,
      gamma: Number,
      vega: Number,
      iv: Number,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Position", positionSchema);
