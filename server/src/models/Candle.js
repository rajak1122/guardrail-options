const mongoose = require('mongoose');

const candleSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, index: true },
    interval: { type: String, required: true },
    time: { type: Date, required: true, index: true },
    open: { type: Number, required: true },
    high: { type: Number, required: true },
    low: { type: Number, required: true },
    close: { type: Number, required: true },
    volume: { type: Number, default: 0 },
  },
  { timestamps: true },
);

candleSchema.index({ symbol: 1, interval: 1, time: 1 }, { unique: true });

module.exports = mongoose.model('Candle', candleSchema);
