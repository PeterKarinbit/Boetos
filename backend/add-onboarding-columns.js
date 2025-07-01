const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function addOnboardingColumns() {
  try {
    await client.connect();
    console.log('✅ Connected to database successfully!');
    // onboarding_completed
    let res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'onboarding_completed';`);
    if (res.rows.length === 0) {
      await client.query(`ALTER TABLE users ADD COLUMN onboarding_completed boolean DEFAULT false;`);
      console.log('➕ Added onboarding_completed column to users table as boolean.');
    } else {
      console.log('onboarding_completed column already exists on users table.');
    }
    // onboarding_data
    res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'onboarding_data';`);
    if (res.rows.length === 0) {
      await client.query(`ALTER TABLE users ADD COLUMN onboarding_data jsonb;`);
      console.log('➕ Added onboarding_data column to users table as jsonb.');
    } else {
      console.log('onboarding_data column already exists on users table.');
    }
  } catch (err) {
    console.error('❌ Failed to add onboarding columns:', err.message);
  } finally {
    await client.end();
  }
}

addOnboardingColumns(); 