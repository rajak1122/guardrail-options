const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PropAccount',
      required: true,
    },
    symbol: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true },
    averagePrice: { type: Number, required: true },
    realizedPnl: { type: Number, default: 0 },
    unrealizedPnl: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Position', positionSchema);
