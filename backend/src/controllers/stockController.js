const marketDataService = require('../services/marketDataService');

/**
 * @desc    Get all available stocks with search and filter
 * @route   GET /api/stocks
 * @access  Public
 */
const getStocks = async (req, res, next) => {
  try {
    const { search, sector, sort, order } = req.query;
    const stocks = await marketDataService.getStocks({ search, sector, sort, order });
    res.status(200).json({
      success: true,
      count: stocks.length,
      isSimulated: true,
      disclaimer: 'Market data is for educational paper trading simulation purposes only.',
      stocks
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single stock details by symbol
 * @route   GET /api/stocks/:symbol
 * @access  Public
 */
const getStockBySymbol = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const stock = await marketDataService.getStock(symbol);

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: `Stock "${symbol.toUpperCase()}" not found.`
      });
    }

    res.status(200).json({
      success: true,
      isSimulated: true,
      disclaimer: 'Market data is for educational paper trading simulation purposes only.',
      stock
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get stock historical price chart data
 * @route   GET /api/stocks/:symbol/history
 * @access  Public
 */
const getStockHistory = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { timeframe = '1M' } = req.query;

    const history = await marketDataService.getStockHistory(symbol, timeframe);

    res.status(200).json({
      success: true,
      symbol: symbol.toUpperCase(),
      timeframe,
      isSimulated: true,
      count: history.length,
      history
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get market overview (indices, top gainers, top losers, active)
 * @route   GET /api/stocks/overview/market
 * @access  Public
 */
const getMarketOverview = async (req, res, next) => {
  try {
    const overview = await marketDataService.getMarketOverview();
    res.status(200).json({
      success: true,
      ...overview
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get distinct stock sectors
 * @route   GET /api/stocks/sectors/list
 * @access  Public
 */
const getSectors = async (req, res, next) => {
  try {
    const sectors = await marketDataService.getSectors();
    res.status(200).json({
      success: true,
      sectors: ['All', ...sectors]
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStocks,
  getStockBySymbol,
  getStockHistory,
  getMarketOverview,
  getSectors
};
