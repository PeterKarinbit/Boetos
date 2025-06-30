const path = require('path');

module.exports = {
  type: 'better-sqlite3',
  database: ':memory:', // Use in-memory database for tests
  dropSchema: true, // Drop the schema on each test run
  synchronize: true, // Automatically create database schema
  logging: false, // Disable logging for tests
  entities: [
    path.join(__dirname, '../entities/**/*.js')
  ],
  migrations: [
    path.join(__dirname, '../migrations/*.js')
  ],
  cli: {
    migrationsDir: 'src/migrations'
  }
};
