require('dotenv/config');
const { Client } = require('pg');
const config = require('./config');

async function fixMentalHealthMigration() {
  const client = new Client({
    connectionString: config.postgresUri,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected to database');

    // Check if mental_health_checks table exists
    console.log('\n=== Checking mental_health_checks table ===');
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'mental_health_checks'
      );
    `);

    if (tableExists.rows[0].exists) {
      console.log('mental_health_checks table exists. Checking if migration is recorded...');
      
      // Check if the migration is already recorded
      const migrationExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM migrations 
          WHERE name = 'CreateMentalHealthChecks1710700000000'
        );
      `);

      if (!migrationExists.rows[0].exists) {
        console.log('Migration not recorded. Adding it to migrations table...');
        await client.query(`
          INSERT INTO migrations (timestamp, name) 
          VALUES (1710700000000, 'CreateMentalHealthChecks1710700000000')
        `);
        console.log('Migration recorded successfully!');
      } else {
        console.log('Migration is already recorded in migrations table.');
      }

      // Verify the table structure
      console.log('\n=== Verifying table structure ===');
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'mental_health_checks'
        ORDER BY ordinal_position;
      `);

      console.log('Current table structure:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
      });

      // Check for required columns
      const requiredColumns = ['id', 'user_id', 'mood', 'stress', 'sleep', 'energy', 'notes', 'risk_score', 'created_at'];
      const existingColumns = columns.rows.map(col => col.column_name);
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

      if (missingColumns.length > 0) {
        console.log(`\nWarning: Missing columns: ${missingColumns.join(', ')}`);
        console.log('You may need to manually add these columns or recreate the table.');
      } else {
        console.log('\nTable structure looks good!');
      }

    } else {
      console.log('mental_health_checks table does not exist.');
      console.log('The migration should run normally to create the table.');
    }

    console.log('\n=== Fix completed successfully! ===');
  } catch (error) {
    console.error('Error fixing mental health migration:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the function
fixMentalHealthMigration(); 