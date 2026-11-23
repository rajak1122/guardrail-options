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
    phoneNumber: {
      type: String,
      trim: true,
      default: "",
    },

    country: {
      type: String,
      trim: true,
      default: "",
    },

    tradingProfile: {
      experienceLevel: {
        type: String,
        enum: ["BEGINNER", "INTERMEDIATE", "EXPERIENCED"],
        default: null,
      },

      tradingStyle: {
        type: String,
        enum: ["SCALPING", "INTRADAY", "SWING"],
        default: null,
      },

      primaryInstrument: {
        type: String,
        enum: ["NIFTY", "BANKNIFTY"],
        default: null,
      },
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
