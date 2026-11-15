const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PropAccount',
      required: true,
    },
    symbol: { type: String, required: true, trim: true },
    side: { type: String, enum: ['buy', 'sell'], required: true },
    quantity: { type: Number, required: true, min: 1 },
    orderType: { type: String, enum: ['market', 'limit'], default: 'market' },
    price: { type: Number, default: null },
    status: {
      type: String,
      enum: ['pending', 'filled', 'cancelled', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Order', orderSchema);
