require('dotenv').config();

const getDatabaseUri = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  const host = process.env.DB_HOST || 'ep-old-credit-a5yjjynp-pooler.us-east-2.aws.neon.tech';
  const port = process.env.DB_PORT || '5432';
  const user = process.env.DB_USER || 'neondb_owner';
  const password = process.env.DB_PASS || 'npg_dp0PJYlkNh8g';
  const database = process.env.DB_NAME || 'neondb';
  
  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
};

module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  port: process.env.PORT || 3000,
  postgresUri: getDatabaseUri(),
  env: process.env.NODE_ENV || 'development'
}; 