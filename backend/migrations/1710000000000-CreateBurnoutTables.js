import { MigrationInterface, QueryRunner } from 'typeorm';

export default class CreateBurnoutTables1710000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "burnout_score" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "date" TIMESTAMP NOT NULL,
        "score" float NOT NULL,
        "metrics" jsonb NOT NULL,
        "aiInsights" text,
        "recommendations" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS "IDX_BURNOUT_SCORE_USER_DATE" ON "burnout_score" ("userId", "date");

      CREATE TABLE IF NOT EXISTS "stress_pattern" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "patternType" varchar NOT NULL,
        "description" text NOT NULL,
        "severity" varchar NOT NULL,
        "frequency" varchar NOT NULL,
        "detectedAt" TIMESTAMP NOT NULL,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS "IDX_STRESS_PATTERN_USER_TYPE" ON "stress_pattern" ("userId", "patternType");
      CREATE INDEX IF NOT EXISTS "IDX_STRESS_PATTERN_DETECTED_AT" ON "stress_pattern" ("detectedAt");
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "burnout_score";
      DROP TABLE IF EXISTS "stress_pattern";
    `);
  }
} 