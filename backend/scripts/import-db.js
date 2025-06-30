const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// TODO: Fill in your new database connection details
const client = new Client({
  host: 'YOUR_NEW_HOST',
  user: 'YOUR_NEW_USER',
  password: 'YOUR_NEW_PASSWORD',
  database: 'YOUR_NEW_DATABASE',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function importTable(table) {
  const filePath = path.join(__dirname, `${table}.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return;
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!Array.isArray(data) || data.length === 0) {
    console.log(`No data to import for ${table}`);
    return;
  }
  // Optional: Clear table before import
  await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
  const columns = Object.keys(data[0]);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  const insertSQL = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
  for (const row of data) {
    const values = columns.map(col => row[col]);
    try {
      await client.query(insertSQL, values);
    } catch (err) {
      console.error(`Error inserting into ${table}:`, err.message, row);
    }
  }
  console.log(`Imported ${data.length} rows into ${table}`);
}

async function main() {
  await client.connect();

  // List your tables here (same as export order)
  const tables = [
    'user_preferences',
    'ai_intervention_rule',
    'burnout_thresholds',
    'migrations',
    'users',
    'calendar_events',
    'user_voice_settings',
    'mental_health_checks',
    'memory_entries',
    'burnout_scores',
    // add more as needed
  ];

  for (const table of tables) {
    await importTable(table);
  }

  await client.end();
  console.log('Import complete!');
}

main().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
}); 