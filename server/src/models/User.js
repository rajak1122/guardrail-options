const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, trim: true, lowercase: true },
    displayName: { type: String, trim: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('User', userSchema);
