const mongoose = require("mongoose");

const accountActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PropAccount",
      required: true,
      index: true,
    },

    eventType: {
      type: String,
      enum: [
        "ACCOUNT_CREATED",
        "ACCOUNT_RESET",
        "ACCOUNT_BREACHED",
        "JOURNAL_SUBMITTED",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    occurredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true },
);

accountActivitySchema.index({ userId: 1, occurredAt: -1 });
accountActivitySchema.index({ accountId: 1, occurredAt: -1 });

module.exports = mongoose.model("AccountActivity", accountActivitySchema);
