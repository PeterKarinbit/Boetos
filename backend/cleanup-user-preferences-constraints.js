const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function listAndDropForeignKeys() {
  try {
    // List all foreign key constraints on user_preferences
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
    console.error('Error cleaning up constraints:', err.message);
  }
}

async function main() {
  try {
    await client.connect();
    console.log('✅ Connected to database successfully!');
    await listAndDropForeignKeys();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main(); 