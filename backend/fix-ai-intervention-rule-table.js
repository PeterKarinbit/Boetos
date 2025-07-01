const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function dropAiInterventionRuleTable() {
  try {
    await client.query('DROP TABLE IF EXISTS ai_intervention_rule CASCADE;');
    console.log('✅ Dropped ai_intervention_rule table if it existed.');
  } catch (err) {
    console.error('❌ Failed to drop ai_intervention_rule table:', err.message);
  }
}

async function createAiInterventionRuleTable() {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "ai_intervention_rule" (
        "id" SERIAL PRIMARY KEY,
        "name" character varying NOT NULL,
        "description" text,
        "rule_type" character varying NOT NULL,
        "rule_condition" jsonb,
        "intervention_method" character varying,
        "intervention_message_template" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    console.log('✅ Created ai_intervention_rule table.');
  } catch (err) {
    console.error('❌ Failed to create ai_intervention_rule table:', err.message);
  }
}

async function main() {
  try {
    await client.connect();
    console.log('✅ Connected to database successfully!');
    await dropAiInterventionRuleTable();
    await createAiInterventionRuleTable();
    console.log('🎉 ai_intervention_rule table fixed!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main(); 