const express = require('express');
const router = express.Router();
const { buyStock, sellStock, getTradeHistory } = require('../controllers/tradeController');
const { protect } = require('../middleware/auth');
const { validateOrder } = require('../middleware/validate');

router.use(protect); // All trading routes require authentication

router.post('/buy', validateOrder, buyStock);
router.post('/sell', validateOrder, sellStock);
router.get('/history', getTradeHistory);

module.exports = router;
