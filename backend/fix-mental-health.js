const { Client } = require('pg');

async function fixMentalHealthMigration() {
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
    
    // Check if mental_health_checks table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'mental_health_checks'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('✅ mental_health_checks table already exists');
      
      // Check its structure
      const structure = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'mental_health_checks' 
        ORDER BY ordinal_position;
      `);
      
      console.log('Current structure:');
      structure.rows.forEach(row => {
        console.log(`- ${row.column_name} (${row.data_type})`);
      });

      // List of required columns and their types
      const requiredColumns = [
        { name: 'id', type: 'uuid', definition: 'uuid NOT NULL DEFAULT uuid_generate_v4()' },
        { name: 'user_id', type: 'uuid', definition: 'uuid NOT NULL' },
        { name: 'mood', type: 'int', definition: 'integer NOT NULL DEFAULT 0' },
        { name: 'stress', type: 'int', definition: 'integer NOT NULL DEFAULT 0' },
        { name: 'sleep', type: 'int', definition: 'integer NOT NULL DEFAULT 0' },
        { name: 'energy', type: 'int', definition: 'integer NOT NULL DEFAULT 0' },
        { name: 'notes', type: 'text', definition: 'text' },
        { name: 'risk_score', type: 'float', definition: 'float NOT NULL DEFAULT 0' },
        { name: 'created_at', type: 'timestamp', definition: 'timestamp NOT NULL DEFAULT now()' }
      ];

      // Check and add missing columns
      for (const col of requiredColumns) {
        const exists = structure.rows.find(row => row.column_name === col.name);
        if (!exists) {
          console.log(`'${col.name}' column does not exist. Adding it as ${col.definition}...`);
          await client.query(`ALTER TABLE mental_health_checks ADD COLUMN ${col.name} ${col.definition};`);
          console.log(`✅ '${col.name}' column added successfully!`);
        } else {
          // Check type and alter if needed
          let dbType = exists.data_type;
          // Map Postgres types to JS types for comparison
          if (col.type === 'uuid' && dbType !== 'uuid') {
            console.log(`'${col.name}' column is type ${dbType}, but should be uuid. Altering...`);
            await client.query(`ALTER TABLE mental_health_checks ALTER COLUMN ${col.name} TYPE uuid USING ${col.name}::uuid;`);
            console.log(`✅ '${col.name}' column type changed to uuid!`);
          } else if (col.type === 'int' && dbType !== 'integer') {
            console.log(`'${col.name}' column is type ${dbType}, but should be integer. Altering...`);
            await client.query(`ALTER TABLE mental_health_checks ALTER COLUMN ${col.name} TYPE integer USING ${col.name}::integer;`);
            console.log(`✅ '${col.name}' column type changed to integer!`);
          } else if (col.type === 'float' && dbType !== 'double precision' && dbType !== 'real') {
            console.log(`'${col.name}' column is type ${dbType}, but should be float. Altering...`);
            await client.query(`ALTER TABLE mental_health_checks ALTER COLUMN ${col.name} TYPE float USING ${col.name}::float;`);
            console.log(`✅ '${col.name}' column type changed to float!`);
          } else if (col.type === 'text' && dbType !== 'text') {
            console.log(`'${col.name}' column is type ${dbType}, but should be text. Altering...`);
            await client.query(`ALTER TABLE mental_health_checks ALTER COLUMN ${col.name} TYPE text USING ${col.name}::text;`);
            console.log(`✅ '${col.name}' column type changed to text!`);
          } else if (col.type === 'timestamp' && dbType !== 'timestamp without time zone') {
            console.log(`'${col.name}' column is type ${dbType}, but should be timestamp. Altering...`);
            await client.query(`ALTER TABLE mental_health_checks ALTER COLUMN ${col.name} TYPE timestamp USING ${col.name}::timestamp;`);
            console.log(`✅ '${col.name}' column type changed to timestamp!`);
          } else {
            console.log(`✅ '${col.name}' column already exists with correct type.`);
          }
        }
      }
    } else {
      console.log('❌ mental_health_checks table does not exist, creating it...');
      
      // Create the mental_health_checks table
      const createTableSQL = `
        CREATE TABLE mental_health_checks (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
          anxiety_level INTEGER CHECK (anxiety_level >= 1 AND anxiety_level <= 10),
          stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
          sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
          notes TEXT,
          check_date DATE NOT NULL DEFAULT CURRENT_DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      
      await client.query(createTableSQL);
      console.log('✅ mental_health_checks table created successfully!');
    }

    // Record this migration as completed
    const migrationTimestamp = 1710700000000; // From the migration name
    const migrationName = 'CreateMentalHealthChecks1710700000000';
    
    console.log(`🔧 Recording migration: ${migrationName}`);
    
    const insertMigrationSQL = `
      INSERT INTO migrations (name, timestamp) 
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING;
    `;
    
    await client.query(insertMigrationSQL, [migrationName, migrationTimestamp]);
    console.log('✅ Migration recorded successfully!');

    // Show all current tables
    console.log('\n📋 All tables in database:');
    const allTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    allTables.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });

    // Show all migrations
    console.log('\n📝 All recorded migrations:');
    const migrations = await client.query('SELECT * FROM migrations ORDER BY timestamp;');
    migrations.rows.forEach(row => {
      const date = new Date(parseInt(row.timestamp));
      console.log(`- ${row.name} (${date.toISOString().split('T')[0]})`);
    });

    console.log('\n🎉 Mental health migration fixed! Try starting your app again.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // If foreign key constraint fails, it might be because of existing data
    if (error.message.includes('foreign key constraint')) {
      console.log('\n💡 Foreign key constraint error detected.');
      console.log('This might be because there\'s existing data that doesn\'t match.');
      console.log('Would you like me to check for orphaned records?');
    }
  } finally {
    await client.end();
  }
}

fixMentalHealthMigration();