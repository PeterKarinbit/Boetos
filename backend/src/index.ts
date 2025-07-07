import 'dotenv/config';
import app from './app';
import { initializeDataSource } from './data-source';

const PORT = process.env.PORT || 4001;

async function startServer() {
  try {
    await initializeDataSource(); // Ensure TypeORM is initialized before handling requests
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Handle server errors
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log('SIGINT signal received: closing HTTP server');
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();