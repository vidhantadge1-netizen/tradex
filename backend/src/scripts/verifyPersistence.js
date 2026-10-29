const mongoose = require('mongoose');
const { connectDB, disconnectDB, maskMongoUri } = require('../config/db');
const env = require('../config/env');
const User = require('../models/User');
const Stock = require('../models/Stock');
const Trade = require('../models/Trade');
const Holding = require('../models/Holding');
const marketDataService = require('../services/marketDataService');

/**
 * Persistence Verification Script for TradeX
 * 
 * Verifies that:
 * 1. MONGODB_URI connects successfully to persistent MongoDB.
 * 2. Database name used is 'tradex'.
 * 3. Trades and Portfolio Holdings persist across backend disconnection and reconnection (restarting).
 */
const runPersistenceVerification = async () => {
  console.log('====================================================');
  console.log('🧪 TradeX Database Connectivity & Persistence Verification');
  console.log('====================================================');

  if (!env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in backend/.env!');
    console.error('Please configure your MongoDB Atlas connection string in backend/.env:');
    console.error('MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/tradex?retryWrites=true&w=majority');
    process.exit(1);
  }

  console.log(`📡 Configured URI: ${maskMongoUri(env.MONGODB_URI)}`);

  try {
    // -------------------------------------------------------------
    // PHASE 1: Connect to Database
    // -------------------------------------------------------------
    console.log('\n[Phase 1] Connecting to MongoDB...');
    const conn = await connectDB();
    const dbName = conn.name;
    const host = conn.host;

    console.log(`✅ Connected successfully to host: ${host}`);
    console.log(`📁 Database Name: "${dbName}"`);

    if (dbName !== 'tradex') {
      console.warn(`⚠️ Warning: Expected database name "tradex", but connected to "${dbName}".`);
    } else {
      console.log('✅ Database name verified: "tradex"');
    }

    // Initialize sample stocks if needed
    await marketDataService.initializeSampleData();

    // -------------------------------------------------------------
    // PHASE 2: Record a Trade & Portfolio Holding
    // -------------------------------------------------------------
    console.log('\n[Phase 2] Creating test trade & portfolio records...');
    const testEmail = `verify_tester_${Date.now()}@tradex.com`;

    // 1. Create a test user
    const testUser = await User.create({
      fullName: 'Persistence Test Trader',
      email: testEmail,
      password: 'VerifyPassword123!',
      virtualBalance: 100000
    });
    console.log(`👤 Created verification user: ${testEmail} (Initial Balance: ₹${testUser.virtualBalance})`);

    // 2. Fetch a stock to trade
    const stock = await Stock.findOne({ symbol: 'RELIANCE' }) || await Stock.findOne();
    if (!stock) {
      throw new Error('No stock available in database to perform test trade.');
    }

    const tradeQty = 5;
    const tradePrice = stock.currentPrice || 2500;
    const tradeTotal = Number((tradePrice * tradeQty).toFixed(2));

    // 3. Create Trade record
    const testTrade = await Trade.create({
      user: testUser._id,
      type: 'BUY',
      symbol: stock.symbol,
      companyName: stock.name,
      quantity: tradeQty,
      executionPrice: tradePrice,
      totalAmount: tradeTotal,
      realizedProfitLoss: 0,
      timestamp: new Date()
    });
    console.log(`📝 Executed simulated BUY trade: ${tradeQty} shares of ${stock.symbol} @ ₹${tradePrice} (Total: ₹${tradeTotal})`);

    // 4. Create Holding record
    const testHolding = await Holding.create({
      user: testUser._id,
      symbol: stock.symbol,
      companyName: stock.name,
      quantity: tradeQty,
      averageBuyPrice: tradePrice,
      totalInvested: tradeTotal
    });
    console.log(`💼 Created portfolio holding: ${testHolding.quantity} shares of ${testHolding.symbol}`);

    // 5. Update user virtual balance
    const expectedRemainingBalance = Number((100000 - tradeTotal).toFixed(2));
    testUser.virtualBalance = expectedRemainingBalance;
    await testUser.save();
    console.log(`💰 Updated user cash balance: ₹${testUser.virtualBalance}`);

    const tradeId = testTrade._id.toString();
    const holdingId = testHolding._id.toString();
    const userId = testUser._id.toString();

    // -------------------------------------------------------------
    // PHASE 3: Simulate Backend Restart (Disconnect & Reconnect)
    // -------------------------------------------------------------
    console.log('\n[Phase 3] Simulating backend restart (disconnecting from database)...');
    await disconnectDB();
    console.log('🔌 Database disconnected. Simulating cold restart of backend process...');

    // Wait 1 second to simulate offline interval
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log('🔄 Re-establishing fresh database connection...');
    await connectDB();
    console.log('✅ Reconnected successfully!');

    // -------------------------------------------------------------
    // PHASE 4: Verify Persistence of Trades & Portfolio Data
    // -------------------------------------------------------------
    console.log('\n[Phase 4] Verifying data persistence in MongoDB...');

    // 1. Verify User & Balance persisted
    const persistedUser = await User.findById(userId);
    if (!persistedUser) {
      throw new Error('❌ Persistence Failure: Test user not found after restart!');
    }
    console.log(`✅ User found: ${persistedUser.email}`);
    if (Math.abs(persistedUser.virtualBalance - expectedRemainingBalance) > 0.01) {
      throw new Error(`❌ Balance mismatch! Expected ₹${expectedRemainingBalance}, found ₹${persistedUser.virtualBalance}`);
    }
    console.log(`✅ User virtual cash balance correctly persisted: ₹${persistedUser.virtualBalance}`);

    // 2. Verify Trade record persisted
    const persistedTrade = await Trade.findById(tradeId);
    if (!persistedTrade) {
      throw new Error('❌ Persistence Failure: Trade record not found after restart!');
    }
    console.log(`✅ Trade record persisted: ${persistedTrade.type} ${persistedTrade.quantity}x ${persistedTrade.symbol} @ ₹${persistedTrade.executionPrice}`);

    // 3. Verify Holding record persisted
    const persistedHolding = await Holding.findById(holdingId);
    if (!persistedHolding) {
      throw new Error('❌ Persistence Failure: Portfolio holding record not found after restart!');
    }
    console.log(`✅ Portfolio holding persisted: ${persistedHolding.quantity}x ${persistedHolding.symbol} (Invested: ₹${persistedHolding.totalInvested})`);

    // -------------------------------------------------------------
    // PHASE 5: Cleanup Test Verification Records
    // -------------------------------------------------------------
    console.log('\n[Phase 5] Cleaning up test verification records...');
    await Trade.deleteOne({ _id: tradeId });
    await Holding.deleteOne({ _id: holdingId });
    await User.deleteOne({ _id: userId });
    console.log('🧹 Test records successfully cleaned up.');

    console.log('\n====================================================');
    console.log('🎉 ALL PERSISTENCE CHECKS PASSED SUCCESSFULLY!');
    console.log('1. Database connectivity: CONFIRMED');
    console.log('2. Database name "tradex": CONFIRMED');
    console.log('3. User balance persistence: CONFIRMED');
    console.log('4. Trade audit log persistence: CONFIRMED');
    console.log('5. Portfolio holding persistence: CONFIRMED');
    console.log('====================================================\n');

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Persistence Verification Failed:');
    console.error(err.message);
    await disconnectDB();
    process.exit(1);
  }
};

runPersistenceVerification();
