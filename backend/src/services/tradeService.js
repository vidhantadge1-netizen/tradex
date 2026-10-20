const User = require('../models/User');
const Stock = require('../models/Stock');
const Holding = require('../models/Holding');
const Trade = require('../models/Trade');
const marketDataService = require('./marketDataService');

/**
 * TradeService handles paper-trading order executions
 * with strict validations, atomic updates, and mathematical accuracy.
 */
class TradeService {
  /**
   * Execute BUY order
   */
  async executeBuy({ userId, symbol, quantity }) {
    // 1. Sanitize & validate quantity
    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      const error = new Error('Order quantity must be a positive integer greater than zero.');
      error.statusCode = 400;
      throw error;
    }

    if (!symbol || typeof symbol !== 'string') {
      const error = new Error('Valid stock symbol is required.');
      error.statusCode = 400;
      throw error;
    }

    // 2. Fetch server-side stock quote (Never trust client prices)
    const stock = await marketDataService.getStock(symbol.toUpperCase());
    if (!stock) {
      const error = new Error(`Stock with symbol "${symbol.toUpperCase()}" not found.`);
      error.statusCode = 404;
      throw error;
    }

    const executionPrice = stock.currentPrice;
    const totalCost = Number((executionPrice * parsedQty).toFixed(2));

    // 3. Verify user and cash balance
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    if (user.virtualBalance < totalCost) {
      const error = new Error(
        `Insufficient virtual funds. Required: ₹${totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}, Available: ₹${user.virtualBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`
      );
      error.statusCode = 400;
      throw error;
    }

    // 4. Atomic balance deduction
    user.virtualBalance = Number((user.virtualBalance - totalCost).toFixed(2));
    await user.save();

    // 5. Update or create Holding with weighted-average cost basis
    let holding = await Holding.findOne({ user: userId, symbol: stock.symbol });

    if (holding) {
      const currentTotalInvested = holding.totalInvested;
      const currentQty = holding.quantity;
      const newQty = currentQty + parsedQty;
      const newTotalInvested = Number((currentTotalInvested + totalCost).toFixed(2));
      const newAvgBuyPrice = Number((newTotalInvested / newQty).toFixed(2));

      holding.quantity = newQty;
      holding.totalInvested = newTotalInvested;
      holding.averageBuyPrice = newAvgBuyPrice;
      await holding.save();
    } else {
      holding = await Holding.create({
        user: userId,
        symbol: stock.symbol,
        companyName: stock.name,
        quantity: parsedQty,
        averageBuyPrice: executionPrice,
        totalInvested: totalCost
      });
    }

    // 6. Record Trade transaction audit log
    const trade = await Trade.create({
      user: userId,
      type: 'BUY',
      symbol: stock.symbol,
      companyName: stock.name,
      quantity: parsedQty,
      executionPrice: executionPrice,
      totalAmount: totalCost,
      realizedProfitLoss: 0,
      timestamp: new Date()
    });

    return {
      message: `Successfully purchased ${parsedQty} share(s) of ${stock.symbol} at ₹${executionPrice.toFixed(2)}`,
      trade,
      holding,
      updatedBalance: user.virtualBalance
    };
  }

  /**
   * Execute SELL order
   */
  async executeSell({ userId, symbol, quantity }) {
    // 1. Sanitize & validate quantity
    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      const error = new Error('Order quantity must be a positive integer greater than zero.');
      error.statusCode = 400;
      throw error;
    }

    if (!symbol || typeof symbol !== 'string') {
      const error = new Error('Valid stock symbol is required.');
      error.statusCode = 400;
      throw error;
    }

    // 2. Fetch holding and guard against overselling
    const holding = await Holding.findOne({ user: userId, symbol: symbol.toUpperCase() });
    if (!holding || holding.quantity <= 0) {
      const error = new Error(`You do not own any shares of "${symbol.toUpperCase()}".`);
      error.statusCode = 400;
      throw error;
    }

    if (parsedQty > holding.quantity) {
      const error = new Error(
        `Cannot sell ${parsedQty} shares. You currently own only ${holding.quantity} share(s) of ${holding.symbol}.`
      );
      error.statusCode = 400;
      throw error;
    }

    // 3. Fetch server-side stock quote
    const stock = await marketDataService.getStock(symbol.toUpperCase());
    if (!stock) {
      const error = new Error(`Stock with symbol "${symbol.toUpperCase()}" not found.`);
      error.statusCode = 404;
      throw error;
    }

    const executionPrice = stock.currentPrice;
    const grossProceeds = Number((executionPrice * parsedQty).toFixed(2));
    const costBasis = Number((holding.averageBuyPrice * parsedQty).toFixed(2));
    const realizedProfitLoss = Number((grossProceeds - costBasis).toFixed(2));

    // 4. Update user virtual cash balance
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    user.virtualBalance = Number((user.virtualBalance + grossProceeds).toFixed(2));
    await user.save();

    // 5. Update or remove Holding
    const remainingQty = holding.quantity - parsedQty;
    let updatedHolding = null;

    if (remainingQty === 0) {
      await Holding.deleteOne({ _id: holding._id });
    } else {
      holding.quantity = remainingQty;
      holding.totalInvested = Number((holding.averageBuyPrice * remainingQty).toFixed(2));
      await holding.save();
      updatedHolding = holding;
    }

    // 6. Record Trade transaction audit log with realized P&L
    const trade = await Trade.create({
      user: userId,
      type: 'SELL',
      symbol: stock.symbol,
      companyName: stock.name,
      quantity: parsedQty,
      executionPrice: executionPrice,
      totalAmount: grossProceeds,
      realizedProfitLoss: realizedProfitLoss,
      timestamp: new Date()
    });

    return {
      message: `Successfully sold ${parsedQty} share(s) of ${stock.symbol} at ₹${executionPrice.toFixed(2)}`,
      trade,
      holding: updatedHolding,
      remainingQuantity: remainingQty,
      realizedProfitLoss,
      updatedBalance: user.virtualBalance
    };
  }

  /**
   * Get Trade History with filters and pagination
   */
  async getTradeHistory({ userId, type, symbol, sortBy = 'timestamp', sortOrder = 'desc', page = 1, limit = 50 }) {
    const query = { user: userId };

    if (type && ['BUY', 'SELL'].includes(type.toUpperCase())) {
      query.type = type.toUpperCase();
    }

    if (symbol) {
      query.symbol = symbol.toUpperCase();
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [trades, total] = await Promise.all([
      Trade.find(query).sort(sortOptions).skip(skip).limit(limit),
      Trade.countDocuments(query)
    ]);

    return {
      trades,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = new TradeService();
