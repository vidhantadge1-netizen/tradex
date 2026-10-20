const app = require('./app');
const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const marketDataService = require('./services/marketDataService');

const startServer = async () => {
  try {
    // 1. Establish Database Connection (external Mongo or MongoMemoryServer fallback)
    await connectDB();

    // 2. Initialize sample stock data if not already present
    await marketDataService.initializeSampleData();

    // 3. Start Express HTTP Server
    const server = app.listen(env.PORT, () => {
      console.log('====================================================');
      console.log(`🚀 TradeX Backend Engine is running on port ${env.PORT}`);
      console.log(`📡 Environment: ${env.NODE_ENV}`);
      console.log(`💼 Starting Virtual Cash: ₹${env.INITIAL_VIRTUAL_BALANCE.toLocaleString('en-IN')}`);
      console.log(`🌐 Health endpoint: http://localhost:${env.PORT}/api/health`);
      console.log('====================================================');
    });

    // Graceful shutdown handlers
    const shutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        await disconnectDB();
        console.log('[Server] Database disconnected. Process exiting.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    return server;
  } catch (err) {
    console.error('[Server] Failed to initialize backend server:', err);
    process.exit(1);
  }
};

startServer();
