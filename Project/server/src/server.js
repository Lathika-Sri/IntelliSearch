require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const SearchTerm = require('./models/SearchTerm');
const trieManager = require('./managers/TrieManager');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/intellisearch';

async function startServer() {
  try {
    logger.info('Connecting to MongoDB...', { uri: MONGODB_URI.replace(/:[^:]*@/, ':****@') });
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB connected successfully');

    // Initialize in-memory Trie from persistent MongoDB collection
    await trieManager.initialize(SearchTerm);

    const server = app.listen(PORT, () => {
      logger.info(`IntelliSearch Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
      logger.info(`Ready for low-latency autocomplete requests`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = async signal => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        logger.info('HTTP server closed');
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start IntelliSearch Server', { error: error.message });
    process.exit(1);
  }
}

startServer();
