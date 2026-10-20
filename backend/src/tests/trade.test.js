const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const Stock = require('../models/Stock');
const Holding = require('../models/Holding');
const Trade = require('../models/Trade');

let mongoServer;
let token;
let user;
let testStock;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: {
      launchTimeout: 60000
    }
  });
  await mongoose.connect(mongoServer.getUri());

  // Create test stock
  testStock = await Stock.create({
    symbol: 'TESTCO',
    name: 'Test Corporation Ltd.',
    sector: 'Information Technology',
    exchange: 'NSE',
    currency: 'INR',
    currentPrice: 1000.0,
    previousClose: 980.0,
    dayHigh: 1020.0,
    dayLow: 975.0,
    volume: 100000,
    peRatio: 25.0,
    marketCap: '₹1.0T'
  });
}, 70000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
  await Holding.deleteMany({});
  await Trade.deleteMany({});

  // Register fresh user
  const regRes = await request(app).post('/api/auth/register').send({
    fullName: 'Trader Test',
    email: 'trader@tradex.com',
    password: 'Password123'
  });

  token = regRes.body.token;
  user = await User.findOne({ email: 'trader@tradex.com' });
});

describe('Virtual Trading Engine & Order Execution API', () => {
  describe('POST /api/trades/buy', () => {
    it('should successfully buy shares, deduct cash, and create holding', async () => {
      // User starts with 100,000. Buy 10 shares of TESTCO at ~1000 = ~10,000
      const res = await request(app)
        .post('/api/trades/buy')
        .set('Authorization', `Bearer ${token}`)
        .send({
          symbol: 'TESTCO',
          quantity: 10
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.trade).toBeDefined();
      expect(res.body.trade.type).toBe('BUY');
      expect(res.body.trade.symbol).toBe('TESTCO');
      expect(res.body.trade.quantity).toBe(10);

      // Verify user balance deduction
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.virtualBalance).toBeLessThan(100000);
      expect(updatedUser.virtualBalance).toBeCloseTo(100000 - res.body.trade.totalAmount, 2);

      // Verify holding created
      const holding = await Holding.findOne({ user: user._id, symbol: 'TESTCO' });
      expect(holding).not.toBeNull();
      expect(holding.quantity).toBe(10);
      expect(holding.totalInvested).toBeCloseTo(res.body.trade.totalAmount, 2);
    });

    it('should reject buy order when user has insufficient virtual funds', async () => {
      // Stock is around 1000. Try to buy 200 shares = ~200,000 (exceeds 100,000)
      const res = await request(app)
        .post('/api/trades/buy')
        .set('Authorization', `Bearer ${token}`)
        .send({
          symbol: 'TESTCO',
          quantity: 200
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/insufficient virtual funds/i);

      // Verify balance did not change
      const untouchedUser = await User.findById(user._id);
      expect(untouchedUser.virtualBalance).toBe(100000);

      // Verify no holding was created
      const holding = await Holding.findOne({ user: user._id, symbol: 'TESTCO' });
      expect(holding).toBeNull();
    });

    it('should reject buy order with invalid or non-positive quantity', async () => {
      const resZero = await request(app)
        .post('/api/trades/buy')
        .set('Authorization', `Bearer ${token}`)
        .send({ symbol: 'TESTCO', quantity: 0 });
      expect(resZero.statusCode).toBe(400);

      const resNeg = await request(app)
        .post('/api/trades/buy')
        .set('Authorization', `Bearer ${token}`)
        .send({ symbol: 'TESTCO', quantity: -5 });
      expect(resNeg.statusCode).toBe(400);
    });

    it('should reject buy order for non-existent stock symbol', async () => {
      const res = await request(app)
        .post('/api/trades/buy')
        .set('Authorization', `Bearer ${token}`)
        .send({ symbol: 'UNKNOWNXYZ', quantity: 1 });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/trades/sell', () => {
    beforeEach(async () => {
      // Give user an initial holding of 20 shares at avg price 1000
      await Holding.create({
        user: user._id,
        symbol: 'TESTCO',
        companyName: 'Test Corporation Ltd.',
        quantity: 20,
        averageBuyPrice: 1000.0,
        totalInvested: 20000.0
      });

      // Adjust user balance to 80,000
      user.virtualBalance = 80000;
      await user.save();
    });

    it('should successfully sell partial shares, credit cash, and calculate realized P&L', async () => {
      // Sell 5 shares
      const res = await request(app)
        .post('/api/trades/sell')
        .set('Authorization', `Bearer ${token}`)
        .send({
          symbol: 'TESTCO',
          quantity: 5
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.trade.type).toBe('SELL');
      expect(res.body.trade.quantity).toBe(5);
      expect(res.body.remainingQuantity).toBe(15);

      // Verify balance increased
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.virtualBalance).toBeGreaterThan(80000);

      // Verify holding quantity decremented
      const updatedHolding = await Holding.findOne({ user: user._id, symbol: 'TESTCO' });
      expect(updatedHolding.quantity).toBe(15);
    });

    it('should completely remove holding when selling all owned shares', async () => {
      // Sell all 20 shares
      const res = await request(app)
        .post('/api/trades/sell')
        .set('Authorization', `Bearer ${token}`)
        .send({
          symbol: 'TESTCO',
          quantity: 20
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.remainingQuantity).toBe(0);

      // Verify holding is removed from database
      const holdingInDb = await Holding.findOne({ user: user._id, symbol: 'TESTCO' });
      expect(holdingInDb).toBeNull();
    });

    it('should reject sell order when attempting to oversell (selling more shares than owned)', async () => {
      // User owns 20 shares, tries to sell 25
      const res = await request(app)
        .post('/api/trades/sell')
        .set('Authorization', `Bearer ${token}`)
        .send({
          symbol: 'TESTCO',
          quantity: 25
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cannot sell 25 shares/i);

      // Verify holding remained unchanged at 20
      const holding = await Holding.findOne({ user: user._id, symbol: 'TESTCO' });
      expect(holding.quantity).toBe(20);
    });

    it('should reject sell order for a stock the user does not own', async () => {
      const res = await request(app)
        .post('/api/trades/sell')
        .set('Authorization', `Bearer ${token}`)
        .send({
          symbol: 'NOTOWNED',
          quantity: 5
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/do not own any shares/i);
    });
  });

  describe('GET /api/trades/history', () => {
    it('should retrieve audit log of all completed trades', async () => {
      // Buy 2 shares
      await request(app)
        .post('/api/trades/buy')
        .set('Authorization', `Bearer ${token}`)
        .send({ symbol: 'TESTCO', quantity: 2 });

      const res = await request(app)
        .get('/api/trades/history')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.trades.length).toBe(1);
      expect(res.body.trades[0].symbol).toBe('TESTCO');
    });
  });
});
