require('dotenv').config();
const { DataSource } = require('typeorm');
const bcrypt = require('bcryptjs');
const config = require('../src/config');

async function createAdminUser() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: config.postgresUri,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    entities: ['src/entities/*.js'],
    synchronize: true, // This will create tables if they don't exist
    logging: true,
    extra: {
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    },
  });

  try {
    await dataSource.initialize();
    console.log('Connected to database');
    
    // Check if users table exists
    const tableExists = await dataSource.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user')"
    );
    
    if (!tableExists[0].exists) {
      console.log('Users table does not exist. Creating tables...');
      // This will create all tables defined in your entities
      await dataSource.synchronize();
    }
    
    // Check if admin user already exists
    const adminEmail = 'peterm6397@gmail.com';
    const existingUser = await dataSource.query(
      'SELECT * FROM "user" WHERE email = $1', 
      [adminEmail]
    );
    
    if (existingUser.length > 0) {
      console.log('Admin user already exists:');
      console.table(existingUser);
      return;
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const newUser = await dataSource.query(
      'INSERT INTO "user" (email, password, name, email_verified, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [adminEmail, hashedPassword, 'Admin User', true, new Date(), new Date()]
    );
    
    console.log('Admin user created successfully:');
    console.table(newUser);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Disconnected from database');
    }
  }
}

createAdminUser();
