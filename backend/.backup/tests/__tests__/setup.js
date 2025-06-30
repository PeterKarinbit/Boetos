// Mock the data-source module to use SQLite for tests
jest.mock('../data-source', () => {
  const { DataSource } = require('typeorm');
  const path = require('path');

  // Global test timeout (30 seconds)
  const TEST_TIMEOUT = 30000;

  // Create a new in-memory SQLite database for testing
  const testDataSource = new DataSource({
    type: 'better-sqlite3',
    database: ':memory:',
    dropSchema: true,
    synchronize: true,
    logging: false,
    entities: [
      path.join(__dirname, '../entities/**/*.js')
    ],
    migrations: [
      path.join(__dirname, '../migrations/*.js')
    ]
  });

  // Set up test environment
  beforeAll(async () => {
    try {
      // Set test environment variables
      process.env.NODE_ENV = 'test';
      process.env.JWT_SECRET = 'test-secret';
      process.env.SESSION_SECRET = 'test-session-secret';
      process.env.FRONTEND_URL = 'http://localhost:3000';

      // Initialize the test database
      await testDataSource.initialize();

      // Store the data source in the global object for tests to access
      global.testDataSource = testDataSource;
    } catch (error) {
      console.error('❌ Failed to set up test database:', error);
      throw error;
    }
  }, TEST_TIMEOUT);

  // Clean up after all tests
  afterAll(async () => {
    try {
      if (testDataSource.isInitialized) {
        await testDataSource.destroy();
      }
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

      if (!testDataSource.isInitialized) return;

      const queryRunner = testDataSource.createQueryRunner();

      try {
        await queryRunner.startTransaction();

        // Disable foreign key checks
        await queryRunner.query('PRAGMA foreign_keys = OFF');

        // Clear all tables
        await queryRunner.query('DELETE FROM sqlite_sequence');
        await queryRunner.query('DELETE FROM sqlite_stat1');
        await queryRunner.query('DELETE FROM sqlite_stat2');
        await queryRunner.query('DELETE FROM sqlite_stat3');
        await queryRunner.query('DELETE FROM sqlite_stat4');

        // Enable foreign key checks
        await queryRunner.query('PRAGMA foreign_keys = ON');

        // Commit transaction
        await queryRunner.commitTransaction();
      } catch (error) {
        // Rollback transaction if error occurs
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        // Release query runner
        await queryRunner.release();
      }
    } catch (error) {
      console.error('❌ Error during test cleanup:', error);
    }
  });

  // Mock the initialize function to use our test data source
  return {
    AppDataSource: testDataSource,
    initializeDataSource: jest.fn().mockImplementation(async () => {
      if (!testDataSource.isInitialized) {
        await testDataSource.initialize();
      }
      return testDataSource;
    })
  };
});

// Mock other modules that might cause issues in tests
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    // Add other Prisma models/methods as needed
  }))
}));

// Mock the email service
jest.mock('../services/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue({}),
  sendPasswordResetEmail: jest.fn().mockResolvedValue({}),
  sendWelcomeEmail: jest.fn().mockResolvedValue({}),
}));

// Mock the Resend module
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({})
    }
  }))
}));

// Mock the mental health service
jest.mock('../services/mentalHealthService', () => ({
  getBurnoutAssessment: jest.fn().mockResolvedValue({
    score: 25,
    level: 'Low',
    recommendations: ['Take breaks regularly']
  }),
  getMentalHealthResources: jest.fn().mockResolvedValue([
    { id: 1, title: 'Resource 1', url: 'http://example.com/1' },
    { id: 2, title: 'Resource 2', url: 'http://example.com/2' }
  ])
}));

// Mock the burnout calculator if it exists
try {
  // This will only run if the module exists
  require.resolve('../lib/burnoutCalculator');
  jest.mock('../lib/burnoutCalculator', () => ({
    BurnoutCalculator: jest.fn().mockImplementation(() => ({
      calculateScore: jest.fn().mockReturnValue(25),
      getLevel: jest.fn().mockReturnValue('Low'),
      getRecommendations: jest.fn().mockReturnValue(['Take breaks regularly'])
    }))
  }));
} catch (e) {
  // If the module doesn't exist, mock it with a simple object
  jest.mock('../lib/burnoutCalculator', () => ({
    BurnoutCalculator: jest.fn().mockImplementation(() => ({
      calculateScore: jest.fn().mockReturnValue(25),
      getLevel: jest.fn().mockReturnValue('Low'),
      getRecommendations: jest.fn().mockReturnValue(['Take breaks regularly'])
    }))
  }), { virtual: true });
}

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.FRONTEND_URL = 'http://localhost:3000';
