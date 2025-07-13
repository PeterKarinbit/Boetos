import pkg from 'pg';
const { Client } = pkg;

const connectionString = process.env.DATABASE_URL;
const useSSL = process.env.DB_SSL === 'true';

async function testConnection() {
  const client = new Client({
    connectionString,
    ...(useSSL ? { ssl: { rejectUnauthorized: false } } : {})
  });
  try {
    await client.connect();
    const res = await client.query('SELECT NOW()');
    console.log('Database connection successful!');
    console.log('Server time:', res.rows[0].now);
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testConnection(); 