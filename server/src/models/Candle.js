const mongoose = require("mongoose");

const candleSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    index: true, // e.g., 'NIFTY', 'BANKNIFTY', 'NIFTY23500CE'
  },
  timeframe: {
    type: String,
    default: "1m",
  },
  time: {
    type: Number, // Unix timestamp in seconds (required format for TradingView Lightweight Charts)
    required: true,
  },
  open: { type: Number, required: true },
  high: { type: Number, required: true },
  low: { type: Number, required: true },
  close: { type: Number, required: true },
  volume: { type: Number, default: 0 },
});

// Compound index to prevent duplicate 1m bars and speed up chart history queries
candleSchema.index({ symbol: 1, timeframe: 1, time: 1 }, { unique: true });

module.exports = mongoose.model("Candle", candleSchema);
