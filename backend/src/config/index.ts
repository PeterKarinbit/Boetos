import dotenv from 'dotenv';
dotenv.config();

interface DBConfig {
  user: string;
  host: string;
  database: string;
  password: string;
  port: number;
  ssl: {
    rejectUnauthorized: boolean;
  };
}

interface MessageBirdConfig {
  accessKey: string;
  sender: string;
}

interface Config {
  db: DBConfig;
  messagebird: MessageBirdConfig;
}

export const config: Config = {
  db: {
    user: process.env.DB_USER || 'neondb_owner',
    host: process.env.DB_HOST || 'ep-old-credit-a5yjjynp-pooler.us-east-2.aws.neon.tech',
    database: process.env.DB_NAME || 'neondb',
    password: process.env.DB_PASSWORD || 'npg_dp0PJYlkNh8g',
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: {
      rejectUnauthorized: false
    }
  },
  messagebird: {
    accessKey: process.env.MESSAGEBIRD_ACCESS_KEY || '',
    sender: process.env.MESSAGEBIRD_SENDER || ''
  }
}; 