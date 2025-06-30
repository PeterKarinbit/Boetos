require('dotenv/config');
const { Client } = require('pg');

async function fixBurnoutTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/boetos',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected to database');

    // Create burnout_thresholds table
    console.log('Creating burnout_thresholds table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "burnout_thresholds" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "threshold_type" character varying NOT NULL,
        "threshold_value" integer NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_burnout_thresholds" PRIMARY KEY ("id"),
        CONSTRAINT "FK_burnout_thresholds_user" FOREIGN KEY ("user_id") 
          REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    // Create index for burnout_thresholds
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_burnout_thresholds_user" 
      ON "burnout_thresholds" ("user_id");
    `);

    // Create burnout_scores table
    console.log('Creating burnout_scores table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "burnout_scores" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "score" integer NOT NULL,
        "score_date" date NOT NULL,
        "factors" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_burnout_scores" PRIMARY KEY ("id"),
        CONSTRAINT "FK_burnout_scores_user" FOREIGN KEY ("user_id") 
          REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    // Create index for burnout_scores
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_burnout_scores_user_date" 
      ON "burnout_scores" ("user_id", "score_date");
    `);

    // Create calendar_events table
    console.log('Creating calendar_events table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "calendar_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "title" character varying NOT NULL,
        "description" text,
        "start_time" TIMESTAMP NOT NULL,
        "end_time" TIMESTAMP NOT NULL,
        "event_type" character varying NOT NULL,
        "is_all_day" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_calendar_events" PRIMARY KEY ("id"),
        CONSTRAINT "FK_calendar_events_user" FOREIGN KEY ("user_id") 
          REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    // Create index for calendar_events
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_calendar_events_user_time" 
      ON "calendar_events" ("user_id", "start_time");
    `);

    console.log('Burnout tables created successfully!');

  } catch (error) {
    console.error('Error creating burnout tables:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

fixBurnoutTables(); 