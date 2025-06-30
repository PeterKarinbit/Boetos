const { MigrationInterface, QueryRunner } = require('typeorm');

module.exports = class FixBurnoutScoreTable1750600000000 {
  async up(queryRunner) {
    // Always drop the table if it exists
    await queryRunner.query('DROP TABLE IF EXISTS "burnout_scores"');

    // Create the correct table structure
    await queryRunner.query(`
      CREATE TABLE "burnout_scores" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "score" float NOT NULL,
        "date" TIMESTAMP NOT NULL,
        "meeting_hours" float,
        "work_hours" float,
        "focus_blocks" float,
        "breaks_taken" float,
        "sleep_hours" float,
        "stress_indicators" jsonb,
        "recovery_indicators" jsonb,
        "metrics" jsonb,
        "ai_insights" text,
        "recommendations" jsonb,
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      );

      CREATE INDEX "IDX_BURNOUT_SCORE_USER_DATE" ON "burnout_scores" ("user_id", "date");
    `);
  }

  async down(queryRunner) {
    await queryRunner.query('DROP TABLE IF EXISTS "burnout_scores"');
  }
}; 