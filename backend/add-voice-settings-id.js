const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function addVoiceSettingsIdColumn() {
  try {
    await client.connect();
    console.log('✅ Connected to database successfully!');
    const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'voice_settings_id';`);
    if (res.rows.length === 0) {
      await client.query(`ALTER TABLE users ADD COLUMN voice_settings_id integer REFERENCES user_voice_settings(id);`);
      console.log('➕ Added voice_settings_id column to users table as an integer foreign key.');
    } else {
      console.log('voice_settings_id column already exists on users table.');
    }
  } catch (err) {
    console.error('❌ Failed to add voice_settings_id column:', err.message);
  } finally {
    await client.end();
  }
}

addVoiceSettingsIdColumn(); 