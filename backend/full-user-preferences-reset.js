const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function dropForeignKeys() {
  try {
    const res = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'user_preferences' AND constraint_type = 'FOREIGN KEY';
    `);
    if (res.rows.length === 0) {
      console.log('✅ No foreign key constraints found on user_preferences.');
      return;
    }
    for (const row of res.rows) {
      const constraint = row.constraint_name;
      console.log(`🔎 Found foreign key constraint: ${constraint}`);
      await client.query(`ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS "${constraint}";`);
      console.log(`🗑️ Dropped constraint: ${constraint}`);
    }
    console.log('✅ All foreign key constraints on user_preferences have been dropped.');
  } catch (err) {
    console.error('Error dropping constraints:', err.message);
  }
}

async function dropUserPreferencesTable() {
  try {
    await client.query('DROP TABLE IF EXISTS user_preferences CASCADE;');
    console.log('✅ Dropped user_preferences table if it existed.');
  } catch (err) {
    console.error('Error dropping user_preferences table:', err.message);
  }
}

async function confirmTableGone() {
  try {
    const res = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_name = 'user_preferences';`);
    if (res.rows.length === 0) {
      console.log('✅ user_preferences table is gone.');
    } else {
      console.log('❌ user_preferences table still exists.');
    }
  } catch (err) {
    console.error('Error confirming table removal:', err.message);
  }
}

async function main() {
  try {
    await client.connect();
    console.log('✅ Connected to database successfully!');
    await dropForeignKeys();
    await dropUserPreferencesTable();
    await confirmTableGone();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main(); 