import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import path from 'path';
import { config } from './config/index.js';
import logger from './utils/logger.js';

// TypeORM ConnectionOptions for PostgreSQL
type PostgresConnectionOptions = {
  type: 'postgres';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  url?: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
  entities?: any[];
  synchronize?: boolean;
  migrationsRun?: boolean;
  logging?: boolean | string[] | ((...messages: any[]) => void);
  migrations?: string[];
  dropSchema?: boolean;
  extra?: {
    max?: number;
    min?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
    query_timeout?: number;
    statement_timeout?: number;
    idle_in_transaction_session_timeout?: number;
    keepAlive?: boolean;
    keepAliveInitialDelayMillis?: number;
    ssl?: {
      rejectUnauthorized: boolean;
      keepAlive: boolean;
    };
  };
  retryAttempts?: number;
  retryDelay?: number;
  keepConnectionAlive?: boolean;
  connectTimeoutMS?: number;
  application_name?: string;
};

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASS', 'DB_NAME'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.warn(`Warning: ${envVar} is not set. Using default value.`);
  }
}

const isProduction = process.env.NODE_ENV === 'production';

// Determine SSL configuration based on environment
const getSslConfig = (): boolean | { rejectUnauthorized: boolean } => {
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
  logging: false, // Explicitly disable all TypeORM logging
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
  retryAttempts: 5, // Reduced retry attempts
  retryDelay: 1000, // Reduced delay between retries
  keepConnectionAlive: true,
  connectTimeoutMS: 30000, // Reduced connection timeout
  application_name: 'boetos-backend'
};

let isInitialized = false;
let isInitializing = false;
let AppDataSource: DataSource;

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
    // Wait for initialization to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    return initializeDataSource();
  }

  isInitializing = true;
  
  try {
    logger.info('Initializing data source...');
    
    // Initialize the data source
    await AppDataSource.initialize();
    
    // Run migrations if not in test environment
    if (process.env.NODE_ENV !== 'test' && !skipMigrations) {
      try {
        const migrations = await AppDataSource.runMigrations();
        if (migrations.length > 0) {
          logger.info(`Successfully executed ${migrations.length} migrations`);
        } else {
          logger.info('No pending migrations found');
        }
      } catch (migrationError: unknown) {
        const errorMessage = migrationError instanceof Error ? migrationError.message : 'Unknown error';
        logger.warn(`Migration check failed: ${errorMessage}`);
        
        // Try to run migrations anyway, but don't fail the entire initialization
        try {
          const migrations = await AppDataSource.runMigrations();
          if (migrations.length > 0) {
            logger.info(`Successfully executed ${migrations.length} migrations`);
          }
        } catch (runMigrationError: unknown) {
          const errorMessage = runMigrationError instanceof Error ? runMigrationError.message : 'Unknown error';
          logger.error(`Failed to run migrations: ${errorMessage}`);
          // Don't throw here, let the application continue
        }
      }
    }
    
    isInitialized = true;
    logger.info('Data Source has been initialized!');
    return AppDataSource;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error during data source initialization:', errorMessage);
    isInitializing = false;
    throw error;
  }
};

// Create and initialize the data source
const initDataSource = async (): Promise<DataSource> => {
  try {
    AppDataSource = new DataSource(dataSourceOptions as any);
    return await initializeDataSource();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error creating data source:', errorMessage);
    throw new Error(`Failed to create data source: ${errorMessage}`);
  }
};

// Handle process termination
const handleShutdown = async (signal: string) => {
  try {
    logger.info(`${signal} received. Shutting down gracefully...`);
    
    if (AppDataSource?.isInitialized) {
      await AppDataSource.destroy();
      logger.info('Database connection closed');
    }
    
    process.exit(0);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error during ${signal} shutdown:`, errorMessage);
    process.exit(1);
  }
};

// Set up signal handlers
process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

// Initialize and export the data source
export const dataSource = initDataSource();

// Export a function that returns the initialized data source
export const getDataSource = async (): Promise<DataSource> => {
  if (!AppDataSource || !AppDataSource.isInitialized) {
    return await dataSource;
  }
  return AppDataSource;
};

export default getDataSource;
