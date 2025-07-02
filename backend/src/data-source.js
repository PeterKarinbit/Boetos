require('dotenv/config');
require('reflect-metadata');
const { DataSource } = require('typeorm');
const path = require('path');
const config = require('./config');
const logger = require('./utils/logger'); // Import the logger

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASS', 'DB_NAME'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.warn(`Warning: ${envVar} is not set. Using default value.`);
  }
}

const isProduction = process.env.NODE_ENV === 'production';

// Determine SSL configuration based on environment
const getSslConfig = () => {
  // For Neon, we always need SSL
  if (process.env.DATABASE_URL?.includes('neon.tech')) {
    return { rejectUnauthorized: false };
  }
  
  // For local development
  if (!isProduction) {
    return false;
  }
  
  // For production without DATABASE_URL
  return { rejectUnauthorized: false };
};

const skipMigrations = process.env.SKIP_MIGRATIONS === 'true';

const AppDataSource = new DataSource({
  type: 'postgres',
  url: config.postgresUri,
  ssl: getSslConfig(),
  entities: [
    path.join(__dirname, 'entities', '*.{js,ts}')
  ],
  synchronize: false, // Disable auto-synchronization
  migrationsRun: !skipMigrations, // Only run migrations if not skipping
  logging: false, // Explicitly disable all TypeORM logging
  dropSchema: false,
  migrations: skipMigrations ? [] : [
    path.join(__dirname, 'migrations-js', '*.{js,ts}') // Use converted JavaScript migrations
  ],
  extra: {
    // Connection pool settings for better resilience
    max: 10, // Reduced max clients to prevent connection exhaustion
    min: 2,  // Reduced min clients
    idleTimeoutMillis: 30000, // Reduced idle timeout
    connectionTimeoutMillis: 30000, // Reduced connection timeout
    // Query timeout settings
    query_timeout: 30000,
    statement_timeout: 30000,
    idle_in_transaction_session_timeout: 30000,
    // Better reconnect settings for pg driver
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    // SSL settings for Neon
    ssl: {
      rejectUnauthorized: false,
      keepAlive: true,
    },
  },
  retryAttempts: 5, // Reduced retry attempts
  retryDelay: 1000, // Reduced delay between retries
  keepConnectionAlive: true,
  connectTimeoutMS: 30000, // Reduced connection timeout
  application_name: 'boetos-backend'
});

let isInitialized = false;
let isInitializing = false;

const checkConnection = async () => {
  if (!AppDataSource || !AppDataSource.isInitialized) {
    logger.info('checkConnection: DataSource not initialized');
    return false;
  }
  try {
    logger.info('checkConnection: Performing SELECT 1');
    const result = await Promise.race([
      AppDataSource.query('SELECT 1'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection check timeout')), 5000)
      )
    ]);
    logger.info('checkConnection: Success');
    return result && result.length > 0;
  } catch (error) {
    logger.error('Database connection check failed:', error.message);
    return false;
  }
};

const initializeDataSource = async () => {
  if (isInitialized && await checkConnection()) {
    logger.info('initializeDataSource: Already initialized and connection is healthy');
    return AppDataSource;
  }

  if (isInitializing) {
    logger.info('initializeDataSource: Already initializing, waiting...');
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    logger.info('initializeDataSource: Initialization finished by another process');
    return AppDataSource;
  }

  isInitializing = true;
  logger.info('initializeDataSource: Starting initialization');

  // If already initialized but connection is dead, destroy and re-initialize
  if (AppDataSource.isInitialized) {
    try {
      logger.info('initializeDataSource: Destroying existing connection');
      await AppDataSource.destroy();
    } catch (error) {
      logger.warn('Error destroying existing connection:', error.message);
    }
    isInitialized = false;
  }

  let retries = 3; // Reduced retries
  while (retries > 0) {
    try {
      if (!AppDataSource.isInitialized) {
        logger.info('initializeDataSource: Initializing AppDataSource');
        await AppDataSource.initialize();
        logger.info('Data Source has been initialized!');
        // Verify connection is working
        if (!(await checkConnection())) {
          throw new Error('Connection verification failed after initialization');
        }
        // Check if migrations table exists and get pending migrations
        try {
          const pendingMigrations = await AppDataSource.showMigrations();
          if (pendingMigrations) {
            logger.info('Running pending migrations...');
            const migrations = await AppDataSource.runMigrations();
            if (migrations.length > 0) {
              logger.info(`Successfully executed ${migrations.length} migrations`);
            } else {
              logger.info('No pending migrations to execute');
            }
          } else {
            logger.info('No pending migrations found');
          }
        } catch (migrationError) {
          logger.warn('Migration check failed, attempting to continue:', migrationError.message);
          // Try to run migrations anyway, but don't fail the entire initialization
          try {
            const migrations = await AppDataSource.runMigrations();
            if (migrations.length > 0) {
              logger.info(`Successfully executed ${migrations.length} migrations`);
            }
          } catch (runMigrationError) {
            logger.error('Failed to run migrations:', runMigrationError.message);
            // Don't throw here, let the application continue
          }
        }
        isInitialized = true;
      }
      logger.info('initializeDataSource: Initialization complete');
      isInitializing = false;
      return AppDataSource;
    } catch (error) {
      logger.error('Error during Data Source initialization:', error.message);
      retries--;
      if (retries === 0) {
        isInitializing = false;
        throw error;
      }
      logger.info(`Retrying... ${retries} attempts left`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Reduced delay
    }
  }
  isInitializing = false;
};

// Handle process termination
process.on('SIGINT', async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    logger.info('Database connection closed');
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    logger.info('Database connection closed');
  }
  process.exit(0);
});

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Don't exit immediately, allow graceful shutdown
  if (AppDataSource.isInitialized) {
    AppDataSource.destroy()
      .then(() => {
        logger.info('Database connection closed after uncaught exception');
        process.exit(1);
      })
      .catch(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit, just log
});

// Initialize on module load - but make it optional for direct DB scripts
if (process.env.SKIP_DB_INIT !== 'true') {
  initializeDataSource().catch(error => {
    logger.error('Failed to initialize Data Source after retries:', error);
    // Don't exit here, let the app decide what to do
  });
}

module.exports = {
  AppDataSource,
  initializeDataSource,
  checkConnection
}; 