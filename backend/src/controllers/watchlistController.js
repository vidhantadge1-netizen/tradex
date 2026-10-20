const Watchlist = require('../models/Watchlist');
const Stock = require('../models/Stock');
const marketDataService = require('../services/marketDataService');

/**
 * @desc    Get user's watchlist with populated live stock data
 * @route   GET /api/watchlist
 * @access  Private
 */
const getWatchlist = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const items = await Watchlist.find({ user: userId }).sort({ addedAt: -1 });

    const symbols = items.map((i) => i.symbol);
    const stocks = await Stock.find({ symbol: { $in: symbols } });
    const stockMap = new Map();
    stocks.forEach((s) => stockMap.set(s.symbol, marketDataService.applyMicroTick(s)));

    const watchlistWithData = items.map((item) => {
      const stock = stockMap.get(item.symbol);
      return {
        _id: item._id,
        symbol: item.symbol,
        addedAt: item.addedAt,
        stock: stock || null
      };
    });

    res.status(200).json({
      success: true,
      count: watchlistWithData.length,
      watchlist: watchlistWithData
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Add a stock symbol to user's watchlist
 * @route   POST /api/watchlist
 * @access  Private
 */
const addToWatchlist = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { symbol } = req.body;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ success: false, message: 'Stock symbol is required.' });
    }

    const cleanSymbol = symbol.trim().toUpperCase();

    // Verify stock exists in directory
    const stock = await Stock.findOne({ symbol: cleanSymbol });
    if (!stock) {
      return res.status(404).json({ success: false, message: `Stock "${cleanSymbol}" not found.` });
    }

    // Check if already in watchlist
    const existing = await Watchlist.findOne({ user: userId, symbol: cleanSymbol });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: `${cleanSymbol} is already in your watchlist.`,
        watchlist: existing
      });
    }

    const newItem = await Watchlist.create({
      user: userId,
      symbol: cleanSymbol
    });

    res.status(201).json({
      success: true,
      message: `Added ${cleanSymbol} to your watchlist.`,
      item: newItem
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Remove a stock symbol from user's watchlist
 * @route   DELETE /api/watchlist/:symbol
 * @access  Private
 */
const removeFromWatchlist = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({ success: false, message: 'Stock symbol is required.' });
    }

    const cleanSymbol = symbol.trim().toUpperCase();
    const deleted = await Watchlist.findOneAndDelete({ user: userId, symbol: cleanSymbol });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `${cleanSymbol} was not found in your watchlist.`
      });
    }

    res.status(200).json({
      success: true,
      message: `Removed ${cleanSymbol} from your watchlist.`
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist
};
