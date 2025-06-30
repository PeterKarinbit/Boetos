const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// TODO: Fill in your actual connection details
const client = new Client({
  host: 'ep-old-credit-a5yjjynp-pooler.us-east-2.aws.neon.tech',
  user: 'neondb_owner',
  password: 'npg_dp0PJYlkNh8g',
  database: 'neondb',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function exportTable(table) {
  const res = await client.query(`SELECT * FROM ${table}`);
  fs.writeFileSync(
    path.join(__dirname, `${table}.json`),
    JSON.stringify(res.rows, null, 2)
  );
  console.log(`Exported ${table} (${res.rowCount} rows)`);
}

async function getAllTables() {
  const res = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `);
  return res.rows.map(row => row.table_name);
}

async function main() {
  await client.connect();

  const tables = await getAllTables();
  console.log('Exporting tables:', tables);

  for (const table of tables) {
    await exportTable(table);
  }

  await client.end();
  console.log('Export complete!');
}

main().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
}); 