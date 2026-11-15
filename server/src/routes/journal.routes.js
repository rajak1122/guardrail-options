const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const journalLockMiddleware = require('../middleware/journalLockMiddleware');

const router = express.Router();

router.use(authMiddleware, journalLockMiddleware);
router.get('/', (req, res) => {
  res.json({ trades: [] });
});

module.exports = router;
