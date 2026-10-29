const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const env = require('./env');

let mongodInstance = null;

/**
 * Mask credentials in MongoDB connection string for safe console logging
 */
const maskMongoUri = (uri) => {
  if (!uri) return '';
  return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@)/i, '$1****$3');
};

const connectDB = async () => {
  // If already connected, return existing connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = env.MONGODB_URI;

  if (uri) {
    try {
      console.log(`[Database] Attempting connection to MongoDB at: ${maskMongoUri(uri)}...`);
      const conn = await mongoose.connect(uri, {
        dbName: 'tradex', // Enforce 'tradex' database name
        serverSelectionTimeoutMS: 10000 // 10s for Atlas cloud DNS & TLS handshake
      });
      console.log(`[Database] ✅ Connected successfully to MongoDB: ${conn.connection.host} (Database: ${conn.connection.name})`);
      return mongoose.connection;
    } catch (err) {
      console.error(`[Database] ❌ Connection failed: ${err.message}`);
      console.error('[Database] Persistent database connection is required. Silent fallback to in-memory storage is disabled to prevent data loss.');
      console.error('[Database] Troubleshooting tips for MongoDB Atlas:');
      console.error('  1. Check username and password in backend/.env (URL-encode special characters like @, :, # if necessary).');
      console.error('  2. In MongoDB Atlas, verify "Network Access" includes your IP (or 0.0.0.0/0 to allow connections from anywhere).');
      console.error('  3. In MongoDB Atlas, verify "Database Access" user has "readWriteAnyDatabase" or read/write permissions on "tradex".');
      console.error('  4. Ensure your cluster is active and not paused.');
      throw err;
    }
  }

  // If no MONGODB_URI is provided, check if explicit in-memory flag is set
  if (process.env.ALLOW_IN_MEMORY === 'true') {
    console.warn('[Database] ⚠️ ALLOW_IN_MEMORY=true: Starting embedded MongoMemoryServer for development.');
    console.warn('[Database] ⚠️ Data will NOT persist after the server stops.');
    try {
      mongodInstance = await MongoMemoryServer.create();
      const memUri = mongodInstance.getUri();
      await mongoose.connect(memUri, { dbName: 'tradex' });
      console.log(`[Database] Connected to in-memory MongoDB at: ${memUri} (Database: tradex)`);
      return mongoose.connection;
    } catch (err) {
      console.error('[Database] Failed to start in-memory MongoDB:', err);
      throw err;
    }
  }

  const missingUriError = new Error(
    '[Database] MONGODB_URI is not set in backend/.env.\n' +
    'To connect to your persistent MongoDB Atlas cluster, add the following to backend/.env:\n' +
    'MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/tradex?retryWrites=true&w=majority'
  );
  console.error(missingUriError.message);
  throw missingUriError;
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
      mongodInstance = null;
    }
  } catch (err) {
    console.error('[Database] Error while disconnecting:', err);
  }
};

module.exports = { connectDB, disconnectDB, maskMongoUri };
