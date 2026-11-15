function journalLockMiddleware(req, res, next) {
  if (req.account?.journalLockedUntil && req.account.journalLockedUntil > new Date()) {
    return res.status(423).json({
      message: 'This account is temporarily locked.',
      lockedUntil: req.account.journalLockedUntil,
    });
  }

  return next();
}

module.exports = journalLockMiddleware;
