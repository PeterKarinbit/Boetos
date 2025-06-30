require('dotenv/config');
const { Client } = require('pg');

async function fixBurnoutScores() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/boetos',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected to database');

    // Check if burnout_scores table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'burnout_scores'
      );
    `);

    if (tableExists.rows[0].exists) {
      console.log('burnout_scores table exists. Checking columns...');
      
      // Check current columns
      const columns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'burnout_scores'
        ORDER BY ordinal_position;
      `);

      console.log('Current columns:');
      columns.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type}`);
      });

      // Add missing score_date column if it doesn't exist
      const scoreDateExists = columns.rows.some(col => col.column_name === 'score_date');
      
      if (!scoreDateExists) {
        console.log('Adding score_date column...');
        await client.query(`
          ALTER TABLE burnout_scores ADD COLUMN score_date date;
        `);
        console.log('✓ Added score_date column');
      } else {
        console.log('✓ score_date column already exists');
      }

      // Create index if it doesn't exist
      console.log('Creating index...');
      await client.query(`
        CREATE INDEX IF NOT EXISTS "IDX_burnout_scores_user_date" 
        ON "burnout_scores" ("user_id", "score_date");
      `);
      console.log('✓ Index created');

    } else {
      console.log('burnout_scores table does not exist. Creating it...');
      await client.query(`
        CREATE TABLE "burnout_scores" (
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

      await client.query(`
        CREATE INDEX IF NOT EXISTS "IDX_burnout_scores_user_date" 
        ON "burnout_scores" ("user_id", "score_date");
      `);
      console.log('✓ Created burnout_scores table with index');
    }

    console.log('Burnout scores table fixed successfully!');

  } catch (error) {
    console.error('Error fixing burnout scores table:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

fixBurnoutScores(); 