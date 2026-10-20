const tradeService = require('../services/tradeService');

/**
 * @desc    Execute BUY order with virtual money
 * @route   POST /api/trades/buy
 * @access  Private
 */
const buyStock = async (req, res, next) => {
  try {
    const { symbol, quantity } = req.body;
    const userId = req.user._id;

    const result = await tradeService.executeBuy({
      userId,
      symbol,
      quantity
    });

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Execute SELL order
 * @route   POST /api/trades/sell
 * @access  Private
 */
const sellStock = async (req, res, next) => {
  try {
    const { symbol, quantity } = req.body;
    const userId = req.user._id;

    const result = await tradeService.executeSell({
      userId,
      symbol,
      quantity
    });

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get user's transaction / trade audit history
 * @route   GET /api/trades/history
 * @access  Private
 */
const getTradeHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { type, symbol, sortBy, sortOrder, page, limit } = req.query;

    const result = await tradeService.getTradeHistory({
      userId,
      type,
      symbol,
      sortBy,
      sortOrder,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 50
    });

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  buyStock,
  sellStock,
  getTradeHistory
};
