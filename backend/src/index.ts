import 'dotenv/config';
import 'reflect-metadata';
import app from './app';
import config from './config';
import { initializeDataSource } from './data-source';
import logger from './utils/logger';

// Import routes (if needed for side effects)
import './routes/auth';
import './routes/burnout';

const PORT = process.env.PORT || 4001;

async function startServer() {
  try {
    // Initialize database connection
    await initializeDataSource();
    console.log('Database connection established');

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Handle server errors
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT signal received: closing HTTP server');
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 