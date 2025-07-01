const { Client } = require('pg');

async function recordMigration() {
  const client = new Client({
    host: 'ep-plain-bread-a5p7dj2v-pooler.us-east-2.aws.neon.tech',
    port: 5432,
    user: 'boetos-db_owner',
    password: 'npg_slfaKcQy34YR',
    database: 'boetos-db',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database successfully!');
    
    // The timestamp from the migration name suggests it's from 2023-06-17
    // Let's use that timestamp: 1687015369742 (which is in the migration name)
    const migrationTimestamp = 1687015369742;
    const migrationName = 'CreateUserVoiceSettings1687015369742';
    
    console.log(`🔧 Recording migration: ${migrationName} with timestamp: ${migrationTimestamp}`);
    
    const insertMigrationSQL = `
      INSERT INTO migrations (name, timestamp) 
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING;
    `;
    
    const result = await client.query(insertMigrationSQL, [migrationName, migrationTimestamp]);
    console.log('✅ Migration recorded successfully!');
    
    // Verify the migration was recorded
    const migrations = await client.query('SELECT * FROM migrations ORDER BY timestamp;');
    console.log('\n📝 All migration records:');
    migrations.rows.forEach(row => {
      const date = new Date(parseInt(row.timestamp));
      console.log(`- ID: ${row.id}, Name: ${row.name}, Timestamp: ${row.timestamp} (${date.toISOString()})`);
    });
    
    console.log('\n🎉 Database is now properly set up!');
    console.log('You can now start your application with: npm start');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

recordMigration();