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
    user: process.env.DB_USER || 'boetos-db_owner',
    host: process.env.DB_HOST || 'ep-plain-bread-a5p7dj2v-pooler.us-east-2.aws.neon.tech',
    database: process.env.DB_NAME || 'boetos-db',
    password: process.env.DB_PASSWORD || 'npg_slfaKcQy34YR',
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