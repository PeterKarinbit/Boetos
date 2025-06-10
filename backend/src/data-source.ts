import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entity/User';
import { AiInterventionRule } from './entity/AiInterventionRule';
import { UserPreferences } from './entity/UserPreferences';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  database: process.env.DB_NAME || 'boetos',
  synchronize: false, // Set back to false, as schema is managed by init.ts
  logging: false,
  entities: [User, AiInterventionRule, UserPreferences],
  migrations: [],
  subscribers: [],
  ssl: { rejectUnauthorized: false },
}); 