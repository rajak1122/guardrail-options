const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      default: "Trader",
    },
    activeAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PropAccount",
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
