const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function enableUuidExtension() {
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    console.log('✅ uuid-ossp extension enabled!');
  } catch (err) {
    console.error('❌ Failed to enable uuid-ossp extension:', err.message);
  }
}

async function dropUserPreferencesTable() {
  try {
    await client.query('DROP TABLE IF EXISTS user_preferences CASCADE;');
    console.log('✅ Dropped user_preferences table if it existed.');
  } catch (err) {
    console.error('❌ Failed to drop user_preferences table:', err.message);
  }
}

async function main() {
  try {
    await client.connect();
    console.log('✅ Connected to database successfully!');
    await enableUuidExtension();
    await dropUserPreferencesTable();
    console.log('🎉 Fix complete! You can now re-run your migrations.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main(); 