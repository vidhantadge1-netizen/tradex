const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: {
      launchTimeout: 60000
    }
  });
  await mongoose.connect(mongoServer.getUri());
}, 70000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('Authentication & User Management API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with ₹100,000 starting virtual balance', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Test Trader',
          email: 'test@tradex.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('test@tradex.com');
      expect(res.body.user.virtualBalance).toBe(100000);

      // Verify in database
      const userInDb = await User.findOne({ email: 'test@tradex.com' });
      expect(userInDb).not.toBeNull();
      expect(userInDb.virtualBalance).toBe(100000);
      expect(userInDb.password).not.toBe('Password123!'); // Has been hashed
    });

    it('should reject registration if email is already registered', async () => {
      await request(app).post('/api/auth/register').send({
        fullName: 'First Trader',
        email: 'duplicate@tradex.com',
        password: 'Password123!'
      });

      const res = await request(app).post('/api/auth/register').send({
        fullName: 'Second Trader',
        email: 'duplicate@tradex.com',
        password: 'Password123!'
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('should reject registration with invalid email or short password', async () => {
      const res = await request(app).post('/api/auth/register').send({
        fullName: 'Short Pass',
        email: 'not-an-email',
        password: '123'
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        fullName: 'Login Trader',
        email: 'login@tradex.com',
        password: 'CorrectPassword123'
      });
    });

    it('should login successfully with valid credentials and return JWT', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@tradex.com',
        password: 'CorrectPassword123'
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('login@tradex.com');
      expect(res.body.user.virtualBalance).toBe(100000);
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@tradex.com',
        password: 'WrongPassword999'
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@tradex.com',
        password: 'SomePassword123'
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile when authenticated', async () => {
      const regRes = await request(app).post('/api/auth/register').send({
        fullName: 'Profile Trader',
        email: 'profile@tradex.com',
        password: 'SecurePassword123'
      });
      const token = regRes.body.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('profile@tradex.com');
      expect(res.body.user.virtualBalance).toBe(100000);
    });

    it('should reject request without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
