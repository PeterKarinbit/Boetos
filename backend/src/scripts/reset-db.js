require('dotenv').config();
const { AppDataSource } = require('../data-source');

async function resetDatabase() {
  try {
    // Initialize the data source
    await AppDataSource.initialize();
    console.log('Connected to database');
    
    // Drop existing tables
    console.log('Dropping existing tables...');
    await AppDataSource.query(`
      DROP TABLE IF EXISTS "ai_intervention_rule" CASCADE;
      DROP TYPE IF EXISTS "ai_intervention_rule" CASCADE;
      DROP TABLE IF EXISTS "user_preferences" CASCADE;
      DROP TABLE IF EXISTS "user_schedule" CASCADE;
      DROP TABLE IF EXISTS "meeting" CASCADE;
      DROP TABLE IF EXISTS "activity" CASCADE;
      DROP TABLE IF EXISTS "users" CASCADE;
      DROP TABLE IF EXISTS "migrations" CASCADE;
    `);
    console.log('Tables dropped successfully');

    // Create migrations table
    console.log('Creating migrations table...');
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS "migrations" (
        "id" SERIAL NOT NULL,
        "timestamp" bigint NOT NULL,
        "name" character varying NOT NULL,
        CONSTRAINT "PK_migrations" PRIMARY KEY ("id")
      )
    `);

    // Create uuid-ossp extension
    await AppDataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Run migrations
    console.log('Running migrations...');

    // 1. Create users table
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password" character varying,
        "name" character varying NOT NULL,
        "profile_image" character varying,
        "avatar" character varying,
        "preferences" jsonb,
        "onboarding_completed" boolean NOT NULL DEFAULT false,
        "onboarding_data" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "google_id" character varying,
        "google_access_token" character varying,
        "google_refresh_token" character varying,
        "voice_settings_id" uuid,
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);
    await AppDataSource.query(`INSERT INTO "migrations"("timestamp", "name") VALUES ($1, $2)`, [1718039500000, "CreateUserTable1718039500000"]);

    // 2. Create user_preferences table
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS "user_preferences" (
        "id" SERIAL NOT NULL,
        "user_id" uuid NOT NULL,
        "preferred_channel" character varying NOT NULL,
        "quiet_hours_start" character varying,
        "quiet_hours_end" character varying,
        "reminder_frequency" integer,
        "tone_preference" character varying NOT NULL,
        "auto_track_categories" text[] NOT NULL,
        "enable_ai_interventions" boolean NOT NULL,
        "preferred_intervention_method" character varying,
        "ai_tone_preference" jsonb,
        "custom_intervention_messages" jsonb,
        "ai_onboarding_memory" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_preferences" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_preferences_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await AppDataSource.query(`INSERT INTO "migrations"("timestamp", "name") VALUES ($1, $2)`, [1718039600000, "CreateUserPreferencesTable1718039600000"]);

    // 3. Create ai_intervention_rule table
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS "ai_intervention_rule" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "rule_name" character varying,
        "rule_type" character varying NOT NULL,
        "rule_condition" jsonb NOT NULL,
        "intervention_method" character varying,
        "intervention_message_template" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_intervention_rule" PRIMARY KEY ("id")
      )
    `);
    await AppDataSource.query(`INSERT INTO "migrations"("timestamp", "name") VALUES ($1, $2)`, [1710000000000, "CreateAiInterventionRule1710000000000"]);

    // Create default user
    const defaultUser = {
      email: 'demo@example.com',
      googleId: 'demo123',
      name: 'Demo User',
      onboardingCompleted: false,
      onboardingData: null
    };

    await AppDataSource.query(
      `INSERT INTO "users"("email", "google_id", "name", "onboarding_completed", "onboarding_data") 
       VALUES ($1, $2, $3, $4, $5)`,
      [defaultUser.email, defaultUser.googleId, defaultUser.name, defaultUser.onboardingCompleted, defaultUser.onboardingData]
    );
    console.log('Default user created');

    console.log('Database reset completed successfully');
  } catch (error) {
    console.error('Database reset failed:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Run the reset
resetDatabase().catch(console.error);