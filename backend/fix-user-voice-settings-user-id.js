const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function fixUserVoiceSettingsUserId() {
  try {
    await client.connect();
    console.log('✅ Connected to database successfully!');
    // Drop user_id if it exists
    const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'user_voice_settings' AND column_name = 'user_id';`);
    if (res.rows.length > 0) {
      await client.query('ALTER TABLE user_voice_settings DROP COLUMN user_id;');
      console.log('🗑️ Dropped user_id column from user_voice_settings.');
    }
    // Add user_id as uuid foreign key
    await client.query('ALTER TABLE user_voice_settings ADD COLUMN user_id uuid REFERENCES users(id);');
    console.log('➕ Added user_id column to user_voice_settings as uuid foreign key to users(id).');
  } catch (err) {
    console.error('❌ Failed to fix user_id column on user_voice_settings:', err.message);
  } finally {
    await client.end();
  }
}

fixUserVoiceSettingsUserId(); 