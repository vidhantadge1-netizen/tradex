const express = require('express');
const router = express.Router();
const {
  getStocks,
  getStockBySymbol,
  getStockHistory,
  getMarketOverview,
  getSectors
} = require('../controllers/stockController');

// Specific endpoints before dynamic :symbol
router.get('/overview/market', getMarketOverview);
router.get('/sectors/list', getSectors);
router.get('/', getStocks);
router.get('/:symbol', getStockBySymbol);
router.get('/:symbol/history', getStockHistory);

module.exports = router;
