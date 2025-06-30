require('dotenv').config();
const { DataSource } = require('typeorm');
const bcrypt = require('bcryptjs');
const config = require('../../src/config');

async function resetDatabase() {
  // Connect without specifying entities first to drop/create the database
  const adminDataSource = new DataSource({
    type: 'postgres',
    url: config.postgresUri,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    logging: true,
  });

  try {
    await adminDataSource.initialize();
    console.log('Connected to database');

    // Drop the database if it exists
    console.log('Dropping existing database...');
    await adminDataSource.query('DROP SCHEMA public CASCADE');
    await adminDataSource.query('CREATE SCHEMA public');
    await adminDataSource.query('GRANT ALL ON SCHEMA public TO postgres');
    await adminDataSource.query('GRANT ALL ON SCHEMA public TO public');
    
    console.log('Database dropped successfully');
  } catch (error) {
    console.error('Error dropping database:', error.message);
    // Continue even if there's an error (might be first run)
  } finally {
    if (adminDataSource.isInitialized) {
      await adminDataSource.destroy();
    }
  }

  // Now create a new connection with entities to create the schema
  const dataSource = new DataSource({
    type: 'postgres',
    url: config.postgresUri,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    entities: ['src/entities/*.js'],
    synchronize: true,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('Connected to new database');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await dataSource.query(
      `INSERT INTO "users" (email, password, "email_verified", "created_at", "updated_at", "name")
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      ['peterm6397@gmail.com', hashedPassword, true, new Date(), new Date(), 'Admin User']
    );

    console.log('Admin user created successfully:');
    console.table(adminUser);

    console.log('Database reset and initialized successfully!');
    console.log('You can now log in with:');
    console.log('Email: peterm6397@gmail.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

resetDatabase();
