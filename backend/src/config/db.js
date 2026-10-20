const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const env = require('./env');

let mongodInstance = null;

const connectDB = async () => {
  // If explicitly requested or default URI, try connecting with a short timeout first
  if (env.MONGODB_URI) {
    try {
      console.log(`[Database] Attempting connection to MongoDB at: ${env.MONGODB_URI}...`);
      await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 3000 // Quick timeout to fallback if no local server
      });
      console.log(`[Database] Connected successfully to external MongoDB: ${mongoose.connection.host}`);
      return mongoose.connection;
    } catch (err) {
      console.warn(`[Database] Could not connect to external MongoDB: ${err.message}`);
      console.log('[Database] Falling back to embedded MongoMemoryServer for standalone zero-config execution...');
    }
  }

  // Fallback to MongoMemoryServer
  try {
    mongodInstance = await MongoMemoryServer.create();
    const uri = mongodInstance.getUri();
    await mongoose.connect(uri);
    console.log(`[Database] Connected successfully to in-memory MongoDB at: ${uri}`);
    return mongoose.connection;
  } catch (err) {
    console.error('[Database] Failed to start and connect to in-memory MongoDB:', err);
    throw err;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (err) {
    console.error('[Database] Error while disconnecting:', err);
  }
};

module.exports = { connectDB, disconnectDB };
