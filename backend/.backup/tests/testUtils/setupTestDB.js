const { DataSource } = require('typeorm');
const bcrypt = require('bcryptjs');
const path = require('path');
const User = require('@/entities/User');

const TEST_USER = { 
  email: 'test@example.com', 
  password: 'test123',
  firstName: 'Test',
  lastName: 'User',
  isEmailVerified: true,
  role: 'user'
};

let testDataSource;

/**
 * Create a test data source
 */
async function createTestDataSource() {
  const dataSource = new DataSource({
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
    ],
    name: 'test',
  });
  
  await dataSource.initialize();
  return dataSource;
}

/**
 * Setup the test database
 */
async function setupTestDB() {
  try {
    // Create a new connection for testing
    testDataSource = await createTestDataSource();
    
    // Get repositories
    const userRepo = testDataSource.getRepository(User);
    
    // Create test user
    const passwordHash = await bcrypt.hash(TEST_USER.password, 10);
    const user = userRepo.create({
      ...TEST_USER,
      password: passwordHash,
    });
    
    await userRepo.save(user);
    
    return { 
      user,
      testDataSource 
    };
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
}

/**
 * Teardown the test database
 */
async function teardownTestDB() {
  try {
    if (testDataSource && testDataSource.isInitialized) {
      // Close the connection
      await testDataSource.destroy();
    }
  } catch (error) {
    console.error('Error tearing down test database:', error);
    throw error;
  }
}

/**
 * Get the test data source
 */
function getTestDataSource() {
  if (!testDataSource || !testDataSource.isInitialized) {
    throw new Error('Test data source is not initialized');
  }
  return testDataSource;
}

module.exports = {
  setupTestDB,
  teardownTestDB,
  getTestDataSource,
  TEST_USER,
};