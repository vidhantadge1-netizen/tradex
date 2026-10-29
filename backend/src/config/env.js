const path = require('path');
const dotenv = require('dotenv');

// Prioritize backend/.env, falling back to process.cwd() .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI ? process.env.MONGODB_URI.trim() : '',
  JWT_SECRET: process.env.JWT_SECRET || 'tradex_super_secret_jwt_key_2026_dev_only',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  INITIAL_VIRTUAL_BALANCE: Number(process.env.INITIAL_VIRTUAL_BALANCE) || 100000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173'
};
