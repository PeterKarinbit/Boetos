const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function addPreferencesColumn() {
  try {
    await client.connect();
    console.log('✅ Connected to database successfully!');
    const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferences';`);
    if (res.rows.length === 0) {
      await client.query(`ALTER TABLE users ADD COLUMN preferences jsonb;`);
      console.log('➕ Added preferences column to users table as jsonb.');
    } else {
      console.log('preferences column already exists on users table.');
    }
  } catch (err) {
    console.error('❌ Failed to add preferences column:', err.message);
  } finally {
    await client.end();
  }
}

addPreferencesColumn(); 