const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function columnExists(table, column) {
  const res = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name=$1 AND column_name=$2`,
    [table, column]
  );
  return res.rows.length > 0;
}

async function addIsActiveColumn() {
  const exists = await columnExists('users', 'is_active');
  if (!exists) {
    console.log('❌ "is_active" column does not exist, adding it...');
    await client.query(`ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true`);
    console.log('✅ "is_active" column added!');
  } else {
    console.log('✅ "is_active" column already exists.');
  }
}

async function main() {
  try {
    await client.connect();
    console.log('✅ Connected to database successfully!');
    await addIsActiveColumn();
    console.log('🎉 User table migration fixed! Try starting your app again.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main(); 