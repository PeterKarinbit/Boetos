import dotenv from 'dotenv';

dotenv.config();

const getDatabaseUri = (): string => {
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

interface Config {
  jwtSecret: string;
  port: string | number;
  postgresUri: string;
  env: string;
  [key: string]: string | number | boolean | undefined; // Allow additional properties
}

const config: Config = {
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  port: process.env.PORT || 3000,
  postgresUri: getDatabaseUri(),
  env: process.env.NODE_ENV || 'development'
};

export default config;
