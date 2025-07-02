const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

const drops = [
  { table: 'users', columns: ['is_active'] },
  { table: 'user_preferences', columns: [
    'break_duration', 'focus_block_duration', 'notifications_enabled', 'work_hours_start', 'work_hours_end', 'theme', 'language', 'timezone'] },
  { table: 'user_voice_settings', columns: ['pitch', 'speed', 'voice_type'] },
  { table: 'ai_intervention_rule', columns: ['name', 'description'] },
];

async function dropColumn(table, column) {
  try {
    await client.query(`ALTER TABLE ${table} DROP COLUMN IF EXISTS ${column}`);
    console.log(`✅ Dropped column ${column} from ${table}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to drop column ${column} from ${table}:`, err.message);
    return false;
  }
}

async function main() {
  await client.connect();
  let totalDropped = 0;
  for (const { table, columns } of drops) {
    for (const column of columns) {
      const dropped = await dropColumn(table, column);
      if (dropped) totalDropped++;
    }
  }
  await client.end();
  console.log(`\nSummary: Dropped ${totalDropped} columns.`);
}

main(); 