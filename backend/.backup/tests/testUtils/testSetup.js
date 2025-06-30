// This file runs before each test file
const { setupTestDB, teardownTestDB, getTestDataSource } = require('./setupTestDB');

// Global test timeout (30 seconds)
const TEST_TIMEOUT = 30000;

// Set up test environment
beforeAll(async () => {
  try {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret';
    process.env.SESSION_SECRET = 'test-session-secret';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    
    // Setup test database
    await setupTestDB();
  } catch (error) {
    console.error('❌ Failed to set up test database:', error);
    throw error;
  }
}, TEST_TIMEOUT);

// Clean up after all tests
afterAll(async () => {
  try {
    await teardownTestDB();
  } catch (error) {
    console.error('❌ Error during test teardown:', error);
  }
}, TEST_TIMEOUT);

// Reset all mocks and clear database after each test
afterEach(async () => {
  try {
    // Clear all mocks
    jest.clearAllMocks();
    jest.restoreAllMocks();
    
    // Get the test data source
    const dataSource = getTestDataSource();
    if (!dataSource || !dataSource.isInitialized) {
      console.warn('Test data source is not initialized');
      return;
    }
    
    // Clear database tables
    const queryRunner = dataSource.createQueryRunner();
    
    try {
      // Start transaction
      await queryRunner.startTransaction();
      
      // Disable foreign key checks
      await queryRunner.query('PRAGMA foreign_keys = OFF');
      
      // Clear all tables
      const entities = dataSource.entityMetadatas;
      for (const entity of entities) {
        try {
          const repository = dataSource.getRepository(entity.name);
          await repository.query(`DELETE FROM ${entity.tableName}`);
        } catch (error) {
          console.warn(`Failed to clear table ${entity.tableName}:`, error.message);
        }
      }
      
      // Reset SQLite sequences
      try {
        await queryRunner.query('DELETE FROM sqlite_sequence');
      } catch (error) {
        console.warn('Failed to reset SQLite sequences:', error.message);
      }
      
      // Enable foreign key checks
      await queryRunner.query('PRAGMA foreign_keys = ON');
      
      // Commit transaction
      await queryRunner.commitTransaction();
    } catch (error) {
      // Rollback transaction if error occurs
      await queryRunner.rollbackTransaction();
      console.error('❌ Error during test cleanup:', error);
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  } catch (error) {
    console.error('❌ Error in test cleanup:', error);
    throw error;
  }
});

// Handle uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Optionally exit with a non-zero code
  // process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Optionally exit with a non-zero code
  // process.exit(1);
});

// Global test timeout
jest.setTimeout(TEST_TIMEOUT);
