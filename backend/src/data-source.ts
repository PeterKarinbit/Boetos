import 'dotenv/config';
import 'reflect-metadata';
import { DataSource, DataSourceOptions, QueryRunner, LoggerOptions } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import path from 'path';
import { config } from './config/index';
import logger from './utils/logger';

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

const dataSourceOptions: PostgresConnectionOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: getSslConfig(),
  entities: [
    path.join(__dirname, 'entities', '*.{js,ts}')
  ],
  synchronize: false, // Disable auto-synchronization
  migrationsRun: !skipMigrations, // Only run migrations if not skipping
  logging: false, // Use only allowed TypeORM values for logging
  dropSchema: false,
  migrations: skipMigrations ? [] : [
    path.join(__dirname, '..', 'migrations', '*.{js,ts}') // Use top-level migrations directory
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
};

let isInitialized = false;
let isInitializing = false;

const checkConnection = async (): Promise<boolean> => {
  if (!AppDataSource?.isInitialized) {
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
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Database connection check failed:', error.message);
    } else {
      logger.error('Database connection check failed with unknown error');
    }
    return false;
  }
};

const initializeDataSource = async (): Promise<DataSource> => {
  if (isInitialized && await checkConnection()) {
    logger.info('initializeDataSource: Already initialized and connection is healthy');
    return AppDataSource;
  }
  
  // Ensure we have a valid data source
  if (!AppDataSource) {
    throw new Error('Data source not properly initialized');
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
        if (error instanceof Error) {
          logger.warn('Error destroying existing connection:', error.message);
        } else {
          logger.warn('Error destroying existing connection:', error);
        }
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
        } catch (runMigrationError: unknown) {
          if (runMigrationError instanceof Error) {
            logger.error('Error running migrations:', runMigrationError.message);
          } else {
            logger.error('Unknown error running migrations');
          }
          const errorMessage = runMigrationError instanceof Error ? runMigrationError.message : 'Unknown error';
          logger.error('Failed to run migrations:', errorMessage);
          // Don't throw here, let the application continue
        }
        isInitialized = true;
      }
      logger.info('initializeDataSource: Initialization complete');
      isInitializing = false;
      return AppDataSource;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error during data source initialization:', errorMessage);
      throw error;
    }
  }
  isInitializing = false;
  throw new Error('Failed to initialize data source after all retries');
};

// Initialize the data source
const initDataSource = async (): Promise<DataSource> => {
  try {
    const dataSource = new DataSource(dataSourceOptions);
    await dataSource.initialize();
    isInitialized = true;
    logger.info('Data Source has been initialized!');
    return dataSource;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error initializing data source:', errorMessage);
    throw new Error(`Failed to initialize data source: ${errorMessage}`);
  }
};

// Create and export the data source
let AppDataSource: DataSource;

const initializeAppDataSource = async () => {
  AppDataSource = await initDataSource();
  return AppDataSource;
};

// Initialize immediately
initializeAppDataSource().catch(error => {
  logger.error('Failed to initialize AppDataSource:', error);
  process.exit(1);
});

module.exports = {
  initializeDataSource,
  checkConnection
};

// Handle process termination
process.on('SIGINT', async () => {
  try {
    if (AppDataSource?.isInitialized) {
      await AppDataSource.destroy();
      logger.info('Data Source has been disconnected');
    }
    process.exit(0);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error during shutdown:', errorMessage);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  try {
    if (AppDataSource?.isInitialized) {
      await AppDataSource.destroy();
      logger.info('Data Source has been disconnected');
    }
    process.exit(0);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error during shutdown:', errorMessage);
    process.exit(1);
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