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

async function addProfileFields() {
  try {
    await AppDataSource.initialize();
    console.log('Connected to database');

    // Add the missing columns to the 'users' table
    const queries = [
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" character varying',
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "company" character varying',
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" text'
    ];

    for (const query of queries) {
      try {
        await AppDataSource.query(query);
        console.log(`Successfully executed: ${query}`);
      } catch (error) {
        console.log(`Column might already exist or error: ${error.message}`);
      }
    }

    console.log('Profile fields added successfully!');
  } catch (error) {
    console.error('Error adding profile fields:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('Database connection closed');
    }
  }
}

addProfileFields(); 