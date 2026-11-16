const PropAccount = require("../models/PropAccount");
const User = require("../models/User");

const journalLockMiddleware = async (req, res, next) => {
  try {
    const firebaseUid = req.user?.uid || req.body.firebaseUid;
    if (!firebaseUid) {
      return res
        .status(400)
        .json({ error: "Missing user identifier for journal lock check." });
    }

    const user = await User.findOne({ firebaseUid });
    if (!user || !user.activeAccountId) {
      return next();
    }

    const account = await PropAccount.findById(user.activeAccountId);
    if (account && account.hasUnjournaledTrade) {
      return res.status(403).json({
        error:
          "Trading Locked: You must complete your mandatory post-trade journal for your last closed trade before placing new orders.",
      });
    }

    next();
  } catch (error) {
    console.error("Journal Lock Middleware Error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = journalLockMiddleware;
