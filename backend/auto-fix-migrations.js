const { execSync } = require('child_process');
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

let summary = {
  droppedTables: [],
  droppedConstraints: [],
  addedColumns: [],
  migrationSuccess: false,
  migrationError: null,
};

async function dropTableIfExists(table) {
  try {
    await client.query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
    console.log(`🗑️ Dropped table: ${table}`);
    summary.droppedTables.push(table);
  } catch (err) {
    console.error(`❌ Failed to drop table ${table}:`, err.message);
  }
}

async function dropForeignKeys(table) {
  try {
    const res = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = $1 AND constraint_type = 'FOREIGN KEY';
    `, [table]);
    for (const row of res.rows) {
      const constraint = row.constraint_name;
      await client.query(`ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS "${constraint}";`);
      console.log(`🗑️ Dropped constraint: ${constraint} on ${table}`);
      summary.droppedConstraints.push(`${table}.${constraint}`);
    }
  } catch (err) {
    console.error(`❌ Failed to drop constraints on ${table}:`, err.message);
  }
}

async function addVoiceSettingsIdColumn() {
  try {
    // Check if column exists
    const res = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'voice_settings_id';`);
    if (res.rows.length === 0) {
      await client.query(`ALTER TABLE users ADD COLUMN voice_settings_id uuid REFERENCES user_voice_settings(id);`);
      console.log('➕ Added voice_settings_id column to users table as a uuid foreign key.');
      summary.addedColumns.push('users.voice_settings_id (uuid FK to user_voice_settings.id)');
    } else {
      console.log('voice_settings_id column already exists on users table.');
    }
  } catch (err) {
    console.error('❌ Failed to add voice_settings_id column:', err.message);
  }
}

async function runMigrations() {
  try {
    execSync('npx typeorm migration:run --dataSource src/data-source.js', { stdio: 'inherit' });
    summary.migrationSuccess = true;
    return true;
  } catch (err) {
    summary.migrationSuccess = false;
    summary.migrationError = err.message;
    console.error('❌ Migration error:', err.message);
    return false;
  }
}

function printSummary() {
  console.log('\n================ MIGRATION AUTO-FIX SUMMARY ================');
  if (summary.droppedTables.length > 0) {
    console.log('Dropped tables:');
    summary.droppedTables.forEach(t => console.log(`  - ${t}`));
  } else {
    console.log('No tables were dropped.');
  }
  if (summary.droppedConstraints.length > 0) {
    console.log('Dropped constraints:');
    summary.droppedConstraints.forEach(c => console.log(`  - ${c}`));
  } else {
    console.log('No constraints were dropped.');
  }
  if (summary.addedColumns.length > 0) {
    console.log('Added columns:');
    summary.addedColumns.forEach(c => console.log(`  - ${c}`));
  } else {
    console.log('No columns were added.');
  }
  if (summary.migrationSuccess) {
    console.log('✅ All migrations ran successfully!');
  } else {
    console.log('❌ Migrations still failed after auto-fix.');
    if (summary.migrationError) {
      console.log('Migration error:', summary.migrationError);
    }
  }
  console.log('===========================================================\n');
}

async function autoFixMigrations() {
  try {
    await client.connect();
    console.log('✅ Connected to database successfully!');
    let success = await runMigrations();
    if (success) {
      printSummary();
      return;
    }
    // Try to auto-fix common issues for known tables
    const tables = ['user_preferences', 'ai_intervention_rule', 'users'];
    for (const table of tables) {
      await dropForeignKeys(table);
      await dropTableIfExists(table);
    }
    // Add missing voice_settings_id column if needed
    await addVoiceSettingsIdColumn();
    // Try running migrations again
    success = await runMigrations();
    printSummary();
  } catch (err) {
    console.error('Error in auto-fix migrations:', err.message);
  } finally {
    await client.end();
  }
}

autoFixMigrations(); 