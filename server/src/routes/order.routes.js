const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);
router.post('/', (req, res) => {
  res.status(501).json({ message: 'Order submission is not implemented yet.' });
});

module.exports = router;
