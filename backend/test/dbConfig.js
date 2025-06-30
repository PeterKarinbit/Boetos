const { Pool } = require('pg');

// Test database configuration
const testDbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres', // Connect to default postgres database first
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  ssl: process.env.DB_SSL === 'true' || false
};

// Function to create test database
async function createTestDatabase() {
  const pool = new Pool(testDbConfig);
  
  try {
    // Create test database if it doesn't exist
    await pool.query('CREATE DATABASE boetos_test');
    console.log('Test database created');
  } catch (error) {
    if (error.code === '42P04') {
      console.log('Test database already exists');
    } else {
      console.error('Error creating test database:', error);
      throw error;
    }
  } finally {
    await pool.end();
  }
}

// Function to drop test database (for cleanup)
async function dropTestDatabase() {
  const pool = new Pool(testDbConfig);
  
  try {
    // Terminate all connections to the test database
    await pool.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'boetos_test'
      AND pid <> pg_backend_pid();
    `);
    
    // Drop the test database
    await pool.query('DROP DATABASE IF EXISTS boetos_test');
    console.log('Test database dropped');
  } catch (error) {
    console.error('Error dropping test database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

module.exports = {
  testDbConfig: {
    ...testDbConfig,
    database: 'boetos_test', // Use the test database for actual tests
    ssl: false
  },
  createTestDatabase,
  dropTestDatabase
};
