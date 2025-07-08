import 'dotenv/config';
import 'reflect-metadata';
import { DataSource, DataSourceOptions, QueryRunner, LoggerOptions } from 'typeorm';
import path from 'path';
import { config } from './config/index.js';
// import logger = require('./utils/logger');

// --- Inlined logger code ---
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info: any) => `[${info.timestamp}] [${info.level.toUpperCase()}]: ${info.message}`
  )
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    new DailyRotateFile({
      filename: 'application-%DATE%.log',
      dirname: 'logs',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info'
    }),
    new DailyRotateFile({
      filename: 'error-%DATE%.log',
      dirname: 'logs',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error'
    })
  ],
});
// --- End inlined logger code ---

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

console.log('[DEBUG] data-source.ts: Before DataSourceOptions definition');
const dataSourceOptions: DataSourceOptions = {
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
console.log('[DEBUG] data-source.ts: After DataSourceOptions definition');

let isInitialized = false;
let isInitializing = false;

console.log('[DEBUG] data-source.ts: Before checkConnection definition');
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
console.log('[DEBUG] data-source.ts: After checkConnection definition');

export const initializeDataSource = async (): Promise<DataSource> => {
  console.log('[DEBUG] data-source.ts: Entered initializeDataSource');
  if (isInitialized && await checkConnection()) {
    console.log('[DEBUG] data-source.ts: Already initialized and connection is healthy');
    return AppDataSource;
  }
  
  // Ensure we have a valid data source
  if (!AppDataSource) {
    console.log('[DEBUG] data-source.ts: AppDataSource not initialized');
    throw new Error('Data source not properly initialized');
  }

  if (isInitializing) {
    console.log('[DEBUG] data-source.ts: Already initializing, waiting...');
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('[DEBUG] data-source.ts: Initialization finished by another process');
    return AppDataSource;
  }

  isInitializing = true;
  console.log('[DEBUG] data-source.ts: Starting initialization');

  // If already initialized but connection is dead, destroy and re-initialize
  if (AppDataSource.isInitialized) {
          try {
        console.log('[DEBUG] data-source.ts: Destroying existing connection');
        await AppDataSource.destroy();
      } catch (error) {
        console.log('[DEBUG] data-source.ts: Error destroying existing connection', error);
      }
    isInitialized = false;
  }

  let retries = 3; // Reduced retries
  while (retries > 0) {
    try {
      if (!AppDataSource.isInitialized) {
        console.log('[DEBUG] data-source.ts: Initializing AppDataSource');
        await AppDataSource.initialize();
        console.log('[DEBUG] data-source.ts: Data Source has been initialized!');
        // Verify connection is working
        if (!(await checkConnection())) {
          throw new Error('Connection verification failed after initialization');
        }
        // Check if migrations table exists and get pending migrations
        try {
          const pendingMigrations = await AppDataSource.showMigrations();
          if (pendingMigrations) {
            console.log('[DEBUG] data-source.ts: Running pending migrations...');
            const migrations = await AppDataSource.runMigrations();
            if (migrations.length > 0) {
              console.log(`[DEBUG] data-source.ts: Successfully executed ${migrations.length} migrations`);
            } else {
              console.log('[DEBUG] data-source.ts: No pending migrations to execute');
            }
          } else {
            console.log('[DEBUG] data-source.ts: No pending migrations found');
          }
        } catch (runMigrationError: unknown) {
          console.log('[DEBUG] data-source.ts: Error running migrations', runMigrationError);
          const errorMessage = runMigrationError instanceof Error ? runMigrationError.message : 'Unknown error';
          logger.error('Failed to run migrations:', errorMessage);
          // Don't throw here, let the application continue
        }
        isInitialized = true;
      }
      console.log('[DEBUG] data-source.ts: Initialization complete');
      isInitializing = false;
      return AppDataSource;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('[DEBUG] data-source.ts: Error during data source initialization', error);
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
export const AppDataSource = new DataSource(dataSourceOptions);

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
// if (process.env.SKIP_DB_INIT !== 'true') {
//   initializeDataSource().catch(error => {
//     logger.error('Failed to initialize Data Source after retries:', error);
//     // Don't exit here, let the app decide what to do
//   });
// } 

console.log('[DEBUG] Importing User entity');
import { User } from './entities/User.js';
console.log('[DEBUG] Imported User entity');
console.log('[DEBUG] Importing UserPreferences entity');
import { UserPreferences } from './entities/UserPreferences.js';
console.log('[DEBUG] Imported UserPreferences entity');
console.log('[DEBUG] Importing UserVoiceSettings entity');
import { UserVoiceSettings } from './entities/UserVoiceSettings.js';
console.log('[DEBUG] Imported UserVoiceSettings entity');
console.log('[DEBUG] Importing Activity entity');
import { Activity } from './entities/Activity.js';
console.log('[DEBUG] Imported Activity entity');
console.log('[DEBUG] Importing Meeting entity');
import { Meeting } from './entities/Meeting.js';
console.log('[DEBUG] Imported Meeting entity');
console.log('[DEBUG] Importing AiInterventionRule entity');
import { AiInterventionRule } from './entities/AiInterventionRule.js';
console.log('[DEBUG] Imported AiInterventionRule entity'); 