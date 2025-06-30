require('dotenv').config();
const { DataSource } = require('typeorm');
const config = require('../src/config');

async function listUsers() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: config.postgresUri,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    entities: ['src/entities/*.js'],
    synchronize: false,
    logging: true,
    extra: {
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    },
  });

  try {
    await dataSource.initialize();
    console.log('Connected to database');
    
    // List all users
    const users = await dataSource.query('SELECT id, email, name, created_at FROM "user"');
    console.log('\nUsers in the database:');
    console.table(users);
    
    // Check for specific email
    const emailToCheck = 'peterm6397@gmail.com';
    const user = await dataSource.query('SELECT * FROM "user" WHERE email = $1', [emailToCheck]);
    console.log(`\nUser with email ${emailToCheck}:`, user.length > 0 ? 'Exists' : 'Not found');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await dataSource.destroy();
    console.log('\nDisconnected from database');
  }
}

listUsers();
