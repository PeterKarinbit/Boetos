require('dotenv/config');
const { DataSource } = require('typeorm');
const path = require('path');

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false,
  entities: [
    path.join(__dirname, 'entities', '*.{js,ts}')
  ],
  synchronize: false,
  logging: true
});

async function checkTables() {
  try {
    await AppDataSource.initialize();
    console.log('Connected to database');

    // Check what tables exist
    const tables = await AppDataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('Available tables:');
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });

    // Check User table structure if it exists
    const userTables = tables.filter(t => t.table_name.toLowerCase().includes('user'));
    if (userTables.length > 0) {
      console.log('\nUser-related tables found:');
      for (const table of userTables) {
        console.log(`\nStructure of ${table.table_name}:`);
        const columns = await AppDataSource.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = '${table.table_name}'
          ORDER BY ordinal_position
        `);
        columns.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
      }
    }

  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('Database connection closed');
    }
  }
}

checkTables(); 