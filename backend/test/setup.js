const { createTestDatabase, dropTestDatabase, testDbConfig } = require('./dbConfig');

// Setup test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = `postgresql://${testDbConfig.user}:${testDbConfig.password}@${testDbConfig.host}:${testDbConfig.port}/${testDbConfig.database}?sslmode=disable`;

// Setup global test timeout
jest.setTimeout(30000);

// Setup global before/after hooks
beforeAll(async () => {
  try {
    // Create test database
    await createTestDatabase();
    
    // Run migrations on test database
    // You might need to run your database migrations here
    // For example: await runMigrations();
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    // Clean up test database
    // Uncomment the following line if you want to drop the test database after tests
    // await dropTestDatabase();
  } catch (error) {
    console.error('Error cleaning up test database:', error);
  }
});

// Global test teardown
afterEach(async () => {
  // Clean up test data after each test if needed
  // For example: await clearTestData();
});
