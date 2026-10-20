const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const Stock = require('../models/Stock');
const Holding = require('../models/Holding');
const Watchlist = require('../models/Watchlist');

let mongoServer;
let token;
let user;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: { launchTimeout: 60000 }
  });
  await mongoose.connect(mongoServer.getUri());

  await Stock.create([
    {
      symbol: 'INFY',
      name: 'Infosys Ltd.',
      sector: 'Information Technology',
      exchange: 'NSE',
      currency: 'INR',
      currentPrice: 1800.0,
      previousClose: 1750.0,
      dayHigh: 1820.0,
      dayLow: 1740.0,
      volume: 500000,
      peRatio: 28.0,
      marketCap: '₹7.5T'
    },
    {
      symbol: 'TCS',
      name: 'Tata Consultancy Services',
      sector: 'Information Technology',
      exchange: 'NSE',
      currency: 'INR',
      currentPrice: 4000.0,
      previousClose: 3950.0,
      dayHigh: 4050.0,
      dayLow: 3920.0,
      volume: 300000,
      peRatio: 30.0,
      marketCap: '₹14.5T'
    }
  ]);
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
  await Watchlist.deleteMany({});

  const regRes = await request(app).post('/api/auth/register').send({
    fullName: 'Portfolio Tester',
    email: 'portfolio@tradex.com',
    password: 'Password123'
  });

  token = regRes.body.token;
  user = await User.findOne({ email: 'portfolio@tradex.com' });
});

describe('Portfolio & Watchlist API', () => {
  describe('GET /api/portfolio', () => {
    it('should return initial empty holdings with ₹100,000 cash balance', async () => {
      const res = await request(app)
        .get('/api/portfolio')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.summary.cashBalance).toBe(100000);
      expect(res.body.summary.totalPortfolioValue).toBe(100000);
      expect(res.body.summary.totalInvested).toBe(0);
      expect(res.body.holdings.length).toBe(0);
      expect(res.body.calculationAssumptions).toBeDefined();
    });

    it('should accurately calculate portfolio metrics with active holdings', async () => {
      // Create holding: 10 shares of INFY bought at 1700 (invested = 17,000)
      await Holding.create({
        user: user._id,
        symbol: 'INFY',
        companyName: 'Infosys Ltd.',
        quantity: 10,
        averageBuyPrice: 1700.0,
        totalInvested: 17000.0
      });

      // Deduct 17,000 from cash: 83,000 remaining
      user.virtualBalance = 83000;
      await user.save();

      const res = await request(app)
        .get('/api/portfolio')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.summary.cashBalance).toBe(83000);
      expect(res.body.summary.totalInvested).toBe(17000);
      // INFY currentPrice is ~1800, so currentValue = ~18,000
      expect(res.body.summary.currentHoldingsValue).toBeGreaterThanOrEqual(17500);
      expect(res.body.summary.totalUnrealizedPnl).toBeGreaterThan(0);
      expect(res.body.holdings.length).toBe(1);
      expect(res.body.holdings[0].symbol).toBe('INFY');
      expect(res.body.assetAllocation.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Watchlist API Endpoints', () => {
    it('should add a stock to the user watchlist', async () => {
      const res = await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ symbol: 'INFY' });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.item.symbol).toBe('INFY');
    });

    it('should retrieve populated watchlist items', async () => {
      await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ symbol: 'TCS' });

      const res = await request(app)
        .get('/api/watchlist')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.watchlist[0].symbol).toBe('TCS');
      expect(res.body.watchlist[0].stock).not.toBeNull();
      expect(res.body.watchlist[0].stock.name).toBe('Tata Consultancy Services');
    });

    it('should remove a stock from the watchlist', async () => {
      await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ symbol: 'INFY' });

      const delRes = await request(app)
        .delete('/api/watchlist/INFY')
        .set('Authorization', `Bearer ${token}`);

      expect(delRes.statusCode).toBe(200);
      expect(delRes.body.success).toBe(true);

      const checkRes = await request(app)
        .get('/api/watchlist')
        .set('Authorization', `Bearer ${token}`);

      expect(checkRes.body.count).toBe(0);
    });
  });
});
