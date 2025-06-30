const { Pool } = require('pg');
const { testDbConfig } = require('./dbConfig');

describe('Database Setup', () => {
  let pool;

  beforeAll(() => {
    // Create a new pool with the test database connection
    pool = new Pool({
      ...testDbConfig,
      database: 'boetos_test' // Ensure we're using the test database
    });
  });

  afterAll(async () => {
    // Close the pool after all tests
    await pool.end();
  });

  test('should connect to the test database', async () => {
    const result = await pool.query('SELECT NOW()');
    expect(result.rows[0]).toHaveProperty('now');
  }, 10000); // Increased timeout for database operations

  test('should have the correct database name', async () => {
    const result = await pool.query('SELECT current_database()');
    expect(result.rows[0].current_database).toBe('boetos_test');
  }, 10000); // Increased timeout for database operations
});
