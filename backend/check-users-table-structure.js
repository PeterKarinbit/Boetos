const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function checkTableStructure() {
  const tableName = 'user_voice_settings';
  try {
    const tableRes = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_name = '${tableName}';`);
    if (tableRes.rows.length === 0) {
      console.log(`❌ Table "${tableName}" does not exist.`);
      return;
    }
    console.log(`✅ Table "${tableName}" exists.`);
    const columnsRes = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${tableName}';`);
    console.log(`Columns in "${tableName}" table:`);
    columnsRes.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });
  } catch (err) {
    console.error(`Error checking ${tableName} table structure:`, err.message);
  }
}

async function main() {
  try {
    await client.connect();
    console.log('✅ Connected to database successfully!');
    await checkTableStructure();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main(); 