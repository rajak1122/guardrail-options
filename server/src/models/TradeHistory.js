const mongoose = require('mongoose');

const tradeHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PropAccount',
      required: true,
    },
    symbol: { type: String, required: true, trim: true },
    side: { type: String, enum: ['buy', 'sell'], required: true },
    quantity: { type: Number, required: true },
    entryPrice: { type: Number, required: true },
    exitPrice: { type: Number, default: null },
    pnl: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model('TradeHistory', tradeHistorySchema);
