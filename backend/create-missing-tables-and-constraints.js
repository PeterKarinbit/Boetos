const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function createActivityTable() {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL,
        type varchar NOT NULL,
        description varchar,
        metadata jsonb,
        created_at timestamp DEFAULT now(),
        CONSTRAINT fk_activity_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ Created activity table.');
  } catch (err) {
    console.error('❌ Failed to create activity table:', err.message);
  }
}

async function createMeetingTable() {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS meeting (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL,
        title varchar NOT NULL,
        description varchar,
        start_time timestamp NOT NULL,
        end_time timestamp NOT NULL,
        participants jsonb,
        google_calendar_event_id varchar,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now(),
        CONSTRAINT fk_meeting_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ Created meeting table.');
  } catch (err) {
    console.error('❌ Failed to create meeting table:', err.message);
  }
}

async function createChatMessagesTable() {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL,
        content text NOT NULL,
        sender varchar NOT NULL,
        created_at timestamp DEFAULT now(),
        session_id uuid,
        CONSTRAINT fk_chat_messages_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ Created chat_messages table.');
  } catch (err) {
    console.error('❌ Failed to create chat_messages table:', err.message);
  }
}

async function createStressPatternsTable() {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS stress_patterns (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        userid varchar NOT NULL,
        patterntype varchar NOT NULL,
        description text NOT NULL,
        severity varchar NOT NULL,
        frequency varchar NOT NULL,
        detectedat timestamp NOT NULL,
        metadata jsonb
      );
    `);
    console.log('✅ Created stress_patterns table.');
  } catch (err) {
    console.error('❌ Failed to create stress_patterns table:', err.message);
  }
}

async function createUserScheduleTable() {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_schedule (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL,
        event_id varchar,
        title varchar,
        description text,
        start_time timestamp,
        end_time timestamp,
        location varchar,
        event_type varchar,
        source varchar,
        is_all_day boolean DEFAULT false,
        status varchar,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now(),
        CONSTRAINT fk_user_schedule_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ Created user_schedule table.');
  } catch (err) {
    console.error('❌ Failed to create user_schedule table:', err.message);
  }
}

async function main() {
  await client.connect();
  await createActivityTable();
  await createMeetingTable();
  await createChatMessagesTable();
  await createStressPatternsTable();
  await createUserScheduleTable();
  await client.end();
  console.log('\nAll missing tables have been created (if they did not exist).');
}

main(); 