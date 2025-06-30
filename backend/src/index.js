require('dotenv/config');
require('reflect-metadata');
const app = require('./app');
const config = require('./config');
const { initializeDataSource } = require('./data-source');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth');
const burnoutRoutes = require('./routes/burnout');

// Ensure PORT is a number
const PORT = parseInt(process.env.PORT, 10) || 4001;

async function startServer() {
  try {
    // Initialize database connection first
    await initializeDataSource();
    logger.info('Database connection established');

    // Start the server
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server is running on port ${PORT} and accessible from network`);
    });

    // Handle server errors
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use. Please try a different port or kill the process using this port.`);
        process.exit(1);
      } else {
        logger.error('Server failed to start:', err);
        process.exit(1);
      }
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();