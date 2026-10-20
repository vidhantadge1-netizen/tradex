const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Stock = require('../models/Stock');
const Holding = require('../models/Holding');
const Trade = require('../models/Trade');
const Watchlist = require('../models/Watchlist');
const sampleStocks = require('../data/sampleStocks');
const env = require('../config/env');

const runSeed = async () => {
  console.log('🌱 Starting TradeX Database Seed Script...');
  try {
    await connectDB();

    // 1. Seed Stocks
    console.log('[Seed] Clearing existing stocks...');
    await Stock.deleteMany({});
    console.log(`[Seed] Inserting ${sampleStocks.length} realistic market stocks...`);
    await Stock.insertMany(sampleStocks);
    console.log('[Seed] Stocks successfully seeded.');

    // 2. Create Demo User Account
    const demoEmail = 'demo@tradex.com';
    console.log(`[Seed] Setting up demo user: ${demoEmail}...`);
    await User.deleteMany({ email: demoEmail });

    const demoUser = await User.create({
      fullName: 'College Demo Trader',
      email: demoEmail,
      password: 'Demo@12345',
      virtualBalance: env.INITIAL_VIRTUAL_BALANCE
    });

    console.log('[Seed] Demo user created with ₹100,000 initial balance.');

    // 3. Clear existing demo user trades & holdings
    await Holding.deleteMany({ user: demoUser._id });
    await Trade.deleteMany({ user: demoUser._id });
    await Watchlist.deleteMany({ user: demoUser._id });

    // 4. Seed initial realistic demo portfolio
    // Buy 10 shares of RELIANCE at ₹2985.40 = ₹29,854.00
    // Buy 5 shares of TCS at ₹4180.25 = ₹20,901.25
    // Buy 8 shares of HDFCBANK at ₹1675.80 = ₹13,406.40
    const demoTrades = [
      { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', qty: 10, price: 2985.40 },
      { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', qty: 5, price: 4180.25 },
      { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', qty: 8, price: 1675.80 }
    ];

    let totalCost = 0;
    for (const item of demoTrades) {
      const cost = Number((item.price * item.qty).toFixed(2));
      totalCost += cost;

      await Holding.create({
        user: demoUser._id,
        symbol: item.symbol,
        companyName: item.name,
        quantity: item.qty,
        averageBuyPrice: item.price,
        totalInvested: cost
      });

      await Trade.create({
        user: demoUser._id,
        type: 'BUY',
        symbol: item.symbol,
        companyName: item.name,
        quantity: item.qty,
        executionPrice: item.price,
        totalAmount: cost,
        realizedProfitLoss: 0,
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000) // 2 days ago
      });
    }

    // Deduct cost from virtual balance
    demoUser.virtualBalance = Number((demoUser.virtualBalance - totalCost).toFixed(2));
    await demoUser.save();

    // 5. Seed initial watchlist for demo user
    await Watchlist.create([
      { user: demoUser._id, symbol: 'INFY' },
      { user: demoUser._id, symbol: 'TATAMOTORS' },
      { user: demoUser._id, symbol: 'AAPL' },
      { user: demoUser._id, symbol: 'NVDA' }
    ]);

    console.log('====================================================');
    console.log('✅ TradeX Seed Completed Successfully!');
    console.log(`👤 Demo Account Email: ${demoEmail}`);
    console.log('🔑 Demo Account Password: Demo@12345');
    console.log(`💰 Demo Cash Balance: ₹${demoUser.virtualBalance.toLocaleString('en-IN')}`);
    console.log(`📈 Demo Invested Amount: ₹${totalCost.toLocaleString('en-IN')}`);
    console.log('====================================================');

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during database seeding:', err);
    await disconnectDB();
    process.exit(1);
  }
};

runSeed();
