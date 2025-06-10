import 'dotenv/config';
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// FIXED: Updated User interface to match TypeORM User entity
export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  profileImage?: string;
  avatar?: string;
  preferences?: any;
  createdAt: Date;
  googleId?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
}

export interface UserPreferences {
  id: number;
  user_id: string; // FIXED: Changed from number to string
  preferred_channel: 'SMS' | 'VOICE' | 'IN_APP';
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  reminder_frequency: number;
  tone_preference: 'FRIENDLY' | 'PROFESSIONAL' | 'CASUAL';
  auto_track_categories: string[];
  enable_ai_interventions: boolean;
  preferred_intervention_method: 'BROWSER_NOTIFICATION' | 'DESKTOP_ALERT' | 'AUDIO_REMINDER' | 'SCREEN_OVERLAY' | 'IN_APP_MESSAGE';
  ai_tone_preference: 'FRIENDLY' | 'PROFESSIONAL' | 'CASUAL' | 'DIRECTIVE' | 'EMPATHETIC';
  custom_intervention_messages: Record<string, string>;
  ai_onboarding_memory: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface ReminderRule {
  id: number;
  user_id: string; // FIXED: Changed from number to string
  event_type: string;
  reminder_template: string;
  escalation_delay: number;
  max_escalations: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AiInterventionRule {
  id: number;
  user_id: string; // FIXED: Changed from number to string
  rule_name: string;
  trigger_type: 'TIME_BASED' | 'ACTIVITY_BASED' | 'EXTERNAL_EVENT' | 'BEHAVIOR_PATTERN';
  trigger_condition: Record<string, any>;
  intervention_message_template: string;
  intervention_method: 'BROWSER_NOTIFICATION' | 'DESKTOP_ALERT' | 'AUDIO_REMINDER' | 'SCREEN_OVERLAY' | 'IN_APP_MESSAGE' | 'NONE' | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface InteractionLog {
  id: number;
  user_id: string; // FIXED: Changed from number to string
  event_id: string;
  channel: 'SMS' | 'VOICE' | 'IN_APP';
  interaction_type: string;
  response_time: number | null;
  user_response: string | null;
  created_at: Date;
}

export interface CommunicationHistory {
  id: number;
  user_id: string; // FIXED: Changed from number to string
  channel: 'SMS' | 'VOICE' | 'IN_APP';
  message_type: string;
  content: string;
  status: 'SENT' | 'DELIVERED' | 'FAILED' | 'RESPONDED';
  response_content: string | null;
  created_at: Date;
}

export interface UserSchedule {
  id: number;
  user_id: string; // Already correct
  event_id: string | null;
  title: string;
  description: string | null;
  start_time: Date;
  end_time: Date;
  location: string | null;
  event_type: 'MEETING' | 'TASK' | 'BLOCKER' | 'PERSONAL' | 'BREAK';
  source: string | null;
  is_all_day: boolean;
  status: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED' | 'COMPLETED';
  created_at: Date;
  updated_at: Date;
} 

async function dropTables(client: any) {
  // Drop tables in reverse order of dependencies
  await client.query(`
    DROP TABLE IF EXISTS user_schedule CASCADE;
    DROP TABLE IF EXISTS communication_history CASCADE;
    DROP TABLE IF EXISTS interaction_log CASCADE;
    DROP TABLE IF EXISTS ai_intervention_rule CASCADE;
    DROP TABLE IF EXISTS reminder_rule CASCADE;
    DROP TABLE IF EXISTS user_preferences CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
  `);
}

export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Drop existing tables
    await dropTables(client);

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        profile_image VARCHAR(255),
        avatar VARCHAR(255),
        preferences JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        google_id VARCHAR(255),
        google_access_token VARCHAR(255),
        google_refresh_token VARCHAR(255)
      );
    `);

    // Insert a default user for initial setup and foreign key satisfaction
    const defaultUserId = '2e5f217f-c892-469c-910b-20ed6c87ef5c';
    const defaultUserEmail = 'default.user@example.com';
    const defaultUserName = 'Default User';

    await client.query(`
      INSERT INTO users (id, email, name, created_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO NOTHING;
    `, [
      defaultUserId,
      defaultUserEmail,
      defaultUserName
    ]);

    // Create user_preferences table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        preferred_channel VARCHAR(50),
        quiet_hours_start TIME,
        quiet_hours_end TIME,
        reminder_frequency INTEGER,
        tone_preference VARCHAR(50),
        auto_track_categories TEXT[],
        enable_ai_interventions BOOLEAN,
        preferred_intervention_method VARCHAR(50),
        ai_tone_preference VARCHAR(50),
        custom_intervention_messages JSONB,
        ai_onboarding_memory JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create reminder_rules table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reminder_rule (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        event_type VARCHAR(50),
        reminder_template TEXT,
        escalation_delay INTEGER,
        max_escalations INTEGER,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create ai_intervention_rule table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_intervention_rule (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        rule_name VARCHAR(255) NOT NULL,
        trigger_type VARCHAR(50) NOT NULL, -- e.g., 'TIME_BASED', 'ACTIVITY_BASED', 'EXTERNAL_EVENT', 'BEHAVIOR_PATTERN'
        trigger_condition JSONB NOT NULL, -- JSON object for conditions
        intervention_message_template TEXT NOT NULL,
        intervention_method VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT ai_intervention_rule_user_rule_unique UNIQUE (user_id, rule_name)
      );
    `);

    // Insert a sample AI Intervention Rule for demonstration
    // This rule triggers when user is IDLE for a certain duration
    // You might want to get a specific user_id from your users table here, or create a default user.
    const sampleUserId = '2e5f217f-c892-469c-910b-20ed6c87ef5c'; // REPLACE WITH AN ACTUAL REGISTERED USER ID

    await client.query(`
      INSERT INTO ai_intervention_rule (
        user_id, rule_name, trigger_type, trigger_condition, 
        intervention_message_template, intervention_method, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id, rule_name) DO NOTHING; -- Prevents inserting duplicate rules
    `, [
      sampleUserId,
      'Idle Wake Up Reminder',
      'ACTIVITY_BASED',
      JSON.stringify({ activityType: 'IDLE', durationMinutes: 5 }), // Trigger when activityType is IDLE and duration is >= 5 mins
      'It looks like you\'ve been idle for a while! Time for a quick stretch or a break.',
      'BROWSER_NOTIFICATION',
      true
    ]);

    // Create interaction_log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS interaction_log (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        event_id VARCHAR(255),
        channel VARCHAR(50),
        interaction_type VARCHAR(50),
        response_time INTEGER,
        user_response TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create communication_history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS communication_history (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        channel VARCHAR(50),
        message_type VARCHAR(50),
        content TEXT,
        status VARCHAR(50),
        response_content TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create user_schedule table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_schedule (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        event_id VARCHAR(255),
        title VARCHAR(255),
        description TEXT,
        start_time TIMESTAMP WITH TIME ZONE,
        end_time TIMESTAMP WITH TIME ZONE,
        location VARCHAR(255),
        event_type VARCHAR(50),
        source VARCHAR(50),
        is_all_day BOOLEAN DEFAULT false,
        status VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT user_schedule_user_event_unique UNIQUE (user_id, event_id)
      );
    `);

    await client.query('COMMIT');
    console.log('Database tables created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}