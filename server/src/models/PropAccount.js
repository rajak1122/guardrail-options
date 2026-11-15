const mongoose = require('mongoose');

const propAccountSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, default: 'Practice Account' },
    startingBalance: { type: Number, default: 100000 },
    balance: { type: Number, default: 100000 },
    status: { type: String, enum: ['active', 'breached'], default: 'active' },
    journalLockedUntil: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model('PropAccount', propAccountSchema);
