import 'dotenv/config';
import app from './app.js';
import { initializeDataSource } from './data-source.js';

const PORT = process.env.PORT || 4001;

async function startServer() {
  try {
    console.log('Initializing data source...');
    await initializeDataSource();
    
    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('Database connection established');
    });

    // Handle server errors
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Consider whether to exit the process or not
      // process.exit(1);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      // Consider whether to exit the process or not
      // process.exit(1);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer().catch((error: Error) => {
  console.error('Unhandled error in startServer:', error);
  process.exit(1);
});