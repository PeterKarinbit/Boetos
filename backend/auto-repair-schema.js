const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

const usersColumns = [
  { name: 'preferences', type: 'jsonb' },
  { name: 'onboarding_completed', type: 'boolean DEFAULT false' },
  { name: 'onboarding_data', type: 'jsonb' },
  { name: 'voice_settings_id', type: 'integer REFERENCES user_voice_settings(id)' },
];

const voiceSettingsColumns = [
  { name: 'voice_model', type: 'character varying' },
  { name: 'voice_id', type: 'character varying' },
  { name: 'voice_enabled', type: 'boolean DEFAULT false' },
  { name: 'voice_language', type: 'character varying' },
  { name: 'voice_speed', type: 'numeric' },
  { name: 'voice_pitch', type: 'numeric' },
  { name: 'voice_volume', type: 'numeric' },
  { name: 'voice_gender', type: 'character varying' },
  { name: 'voice_accent', type: 'character varying' },
  { name: 'voice_style', type: 'character varying' },
  { name: 'voice_emotion', type: 'character varying' },
  { name: 'voice_background', type: 'character varying' },
  { name: 'created_at', type: 'timestamp without time zone DEFAULT now()' },
  { name: 'updated_at', type: 'timestamp without time zone DEFAULT now()' },
];

async function addMissingColumns(table, columns) {
  for (const col of columns) {
    try {
      const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = $2;`, [table, col.name]);
      if (res.rows.length === 0) {
        await client.query(`ALTER TABLE ${table} ADD COLUMN ${col.name} ${col.type};`);
        console.log(`➕ Added column ${col.name} to ${table} as ${col.type}`);
      } else {
        console.log(`Column ${col.name} already exists on ${table}`);
      }
    } catch (err) {
      console.error(`❌ Failed to add column ${col.name} to ${table}:`, err.message);
    }
  }
}

async function main() {
  try {
    await client.connect();
    console.log('✅ Connected to database successfully!');
    await addMissingColumns('users', usersColumns);
    await addMissingColumns('user_voice_settings', voiceSettingsColumns);
    console.log('✅ Auto-repair complete!');
  } catch (err) {
    console.error('❌ Error in auto-repair:', err.message);
  } finally {
    await client.end();
  }
}

main(); 