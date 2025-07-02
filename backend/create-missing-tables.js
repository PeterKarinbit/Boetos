const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function createChatMessagesTable() {
  try {
    const res = await client.query(`SELECT to_regclass('public.chat_messages')`);
    if (!res.rows[0].to_regclass) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL,
          content text NOT NULL,
          sender varchar NOT NULL,
          created_at timestamp DEFAULT now(),
          session_id uuid
        );
      `);
      console.log('✅ Created chat_messages table.');
    } else {
      console.log('chat_messages table already exists.');
    }
  } catch (err) {
    console.error('❌ Failed to create chat_messages table:', err.message);
  }
}

async function createMemoryEntriesTable() {
  try {
    const res = await client.query(`SELECT to_regclass('public.memory_entries')`);
    if (!res.rows[0].to_regclass) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS memory_entries (
          id uuid NOT NULL DEFAULT uuid_generate_v4(),
          user_id uuid NOT NULL,
          content text NOT NULL,
          type varchar NOT NULL DEFAULT 'note',
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "nudgePreference" varchar NOT NULL DEFAULT 'daily',
          "snoozedUntil" TIMESTAMP,
          "isArchived" boolean NOT NULL DEFAULT false,
          "isDone" boolean NOT NULL DEFAULT false,
          CONSTRAINT "PK_memory_entries" PRIMARY KEY (id),
          CONSTRAINT "FK_memory_entries_user" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);
      console.log('✅ Created memory_entries table.');
    } else {
      console.log('memory_entries table already exists.');
    }
  } catch (err) {
    console.error('❌ Failed to create memory_entries table:', err.message);
  }
}

async function main() {
  try {
    await client.connect();
    await createChatMessagesTable();
    await createMemoryEntriesTable();
    // Add more table checks/creations here if needed
  } finally {
    await client.end();
  }
}

main(); 