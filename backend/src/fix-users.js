require('dotenv/config');
const { Client } = require('pg');

async function fixUsersTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/boetos',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected to database');

    // Add the missing is_active column
    console.log('Adding is_active column to users table...');
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
    `);
    console.log('✓ Added is_active column');

    // Add other missing columns
    const columns = [
      { name: 'role', type: 'character varying' },
      { name: 'company', type: 'character varying' },
      { name: 'bio', type: 'text' },
      { name: 'profile_image', type: 'character varying' },
      { name: 'preferences', type: 'jsonb' },
      { name: 'onboarding_completed', type: 'boolean DEFAULT false' },
      { name: 'onboarding_data', type: 'jsonb' },
      { name: 'email_verified', type: 'boolean DEFAULT false' },
      { name: 'email_verification_token', type: 'character varying' },
      { name: 'email_verification_expires', type: 'timestamp' },
      { name: 'google_id', type: 'character varying' }
    ];

    for (const column of columns) {
      console.log(`Adding ${column.name} column...`);
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS ${column.name} ${column.type};
      `);
      console.log(`✓ Added ${column.name} column`);
    }

    console.log('Users table fixed successfully!');

  } catch (error) {
    console.error('Error fixing users table:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

fixUsersTable(); 