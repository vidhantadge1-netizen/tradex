const Stock = require('../models/Stock');
const sampleStocks = require('../data/sampleStocks');

/**
 * Market Data Service Abstraction
 * Supports simulated tick generation, historical interval calculations,
 * and an extensible interface for genuine third-party financial APIs.
 */
class MarketDataService {
  constructor() {
    this.providerName = 'TradeX Simulated Market Engine';
    this.isLiveProvider = false;
  }

  /**
   * Seed stocks in the database if empty
   */
  async initializeSampleData() {
    try {
      const count = await Stock.countDocuments();
      if (count === 0) {
        console.log('[MarketDataService] Database stocks collection is empty. Seeding realistic sample stocks...');
        await Stock.insertMany(sampleStocks);
        console.log(`[MarketDataService] Successfully seeded ${sampleStocks.length} sample stocks.`);
      }
    } catch (err) {
      console.error('[MarketDataService] Error during sample data initialization:', err.message);
    }
  }

  /**
   * Small realistic micro-fluctuation for simulation
   * Simulates tick volatility (up to +/- 0.35%)
   */
  applyMicroTick(stock) {
    // 50% chance of small tick
    if (Math.random() > 0.5) {
      const deltaPercent = (Math.random() - 0.49) * 0.007; // -0.34% to +0.36%
      const newPrice = Number((stock.currentPrice * (1 + deltaPercent)).toFixed(2));
      stock.currentPrice = Math.max(1, newPrice);
      if (stock.currentPrice > stock.dayHigh) stock.dayHigh = stock.currentPrice;
      if (stock.currentPrice < stock.dayLow) stock.dayLow = stock.currentPrice;
    }
    return stock;
  }

  /**
   * Fetch all stocks with optional search, filter by sector, and sorting
   */
  async getStocks({ search = '', sector = '', sort = 'marketCap', order = 'desc' } = {}) {
    const query = {};

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ symbol: regex }, { name: regex }];
    }

    if (sector && sector !== 'All') {
      query.sector = sector;
    }

    let sortOption = {};
    if (sort === 'price') {
      sortOption.currentPrice = order === 'asc' ? 1 : -1;
    } else if (sort === 'name') {
      sortOption.name = order === 'asc' ? 1 : -1;
    } else if (sort === 'symbol') {
      sortOption.symbol = order === 'asc' ? 1 : -1;
    } else if (sort === 'volume') {
      sortOption.volume = order === 'asc' ? 1 : -1;
    } else {
      // default: updated/created
      sortOption.volume = -1;
    }

    const stocks = await Stock.find(query).sort(sortOption);

    // Apply micro tick to simulate active market feel
    return stocks.map((stock) => this.applyMicroTick(stock));
  }

  /**
   * Get stock details by symbol
   */
  async getStock(symbol) {
    if (!symbol) return null;
    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
    if (!stock) return null;
    return this.applyMicroTick(stock);
  }

  /**
   * Get distinct sectors available
   */
  async getSectors() {
    return Stock.distinct('sector');
  }

  /**
   * Get market overview: indices, top gainers, top losers, active
   */
  async getMarketOverview() {
    const allStocks = await Stock.find();
    const stocksWithChange = allStocks.map((stock) => {
      const change = stock.currentPrice - stock.previousClose;
      const changePercent = stock.previousClose ? (change / stock.previousClose) * 100 : 0;
      return {
        _id: stock._id,
        symbol: stock.symbol,
        name: stock.name,
        currentPrice: stock.currentPrice,
        previousClose: stock.previousClose,
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        volume: stock.volume,
        sector: stock.sector
      };
    });

    const topGainers = [...stocksWithChange]
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 5);

    const topLosers = [...stocksWithChange]
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5);

    const mostActive = [...stocksWithChange]
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);

    // Calculate simulated market index (NIFTY 50 simulated equivalent)
    const avgPrice = stocksWithChange.length
      ? stocksWithChange.reduce((acc, s) => acc + s.currentPrice, 0) / stocksWithChange.length
      : 24500;
    const avgChangePercent = stocksWithChange.length
      ? stocksWithChange.reduce((acc, s) => acc + s.changePercent, 0) / stocksWithChange.length
      : 0.45;

    const indices = [
      {
        name: 'NIFTY 50 (SIM)',
        value: Number((24580.40 * (1 + avgChangePercent / 100)).toFixed(2)),
        change: Number((24580.40 * (avgChangePercent / 100)).toFixed(2)),
        changePercent: Number(avgChangePercent.toFixed(2))
      },
      {
        name: 'SENSEX (SIM)',
        value: Number((80850.20 * (1 + (avgChangePercent * 0.95) / 100)).toFixed(2)),
        change: Number((80850.20 * ((avgChangePercent * 0.95) / 100)).toFixed(2)),
        changePercent: Number((avgChangePercent * 0.95).toFixed(2))
      },
      {
        name: 'BANK NIFTY (SIM)',
        value: Number((52140.75 * (1 + (avgChangePercent * 1.1) / 100)).toFixed(2)),
        change: Number((52140.75 * ((avgChangePercent * 1.1) / 100)).toFixed(2)),
        changePercent: Number((avgChangePercent * 1.1).toFixed(2))
      }
    ];

    return {
      provider: this.providerName,
      isSimulated: true,
      indices,
      topGainers,
      topLosers,
      mostActive,
      totalStocksCount: allStocks.length
    };
  }

  /**
   * Filter history by timeframe ('1D', '1W', '1M', '1Y', 'ALL')
   */
  async getStockHistory(symbol, timeframe = '1M') {
    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
    if (!stock || !stock.history || stock.history.length === 0) {
      return [];
    }

    const history = [...stock.history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    if (timeframe === '1D') {
      // Generate intraday 5-min intervals based on currentPrice & previousClose
      const intraday = [];
      const base = stock.previousClose;
      const target = stock.currentPrice;
      const intervals = 18; // e.g. every 20 mins of a trading day
      for (let i = 0; i <= intervals; i++) {
        const progress = i / intervals;
        const noise = (Math.random() - 0.5) * (target * 0.005);
        const interpolated = base + (target - base) * progress + noise;
        const time = new Date();
        time.setHours(9, 15 + i * 20, 0, 0);
        intraday.push({
          timestamp: time,
          price: Number(interpolated.toFixed(2)),
          volume: Math.floor(stock.volume / intervals)
        });
      }
      return intraday;
    }

    if (timeframe === '1W') {
      return history.slice(-7);
    }

    if (timeframe === '1M') {
      return history.slice(-30);
    }

    return history;
  }
}

module.exports = new MarketDataService();
