const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class CreateBurnoutTables1718630400000 {

    async up(queryRunner) {
        // Create burnout_thresholds table
        await queryRunner.query(`
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
            )
        `);

        // Create index for burnout_thresholds
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_burnout_thresholds_user" 
            ON "burnout_thresholds" ("user_id")
        `);

        // Create burnout_scores table
        await queryRunner.query(`
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
            )
        `);

        // Ensure score_date column exists (for idempotency)
        const scoreDateCol = await queryRunner.query(`
            SELECT column_name FROM information_schema.columns WHERE table_name = 'burnout_scores' AND column_name = 'score_date';
        `);
        if (scoreDateCol.length === 0) {
            await queryRunner.query(`ALTER TABLE "burnout_scores" ADD COLUMN "score_date" date NOT NULL DEFAULT CURRENT_DATE;`);
        }

        // Create index for burnout_scores
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_burnout_scores_user_date" 
            ON "burnout_scores" ("user_id", "score_date")
        `);

        // Create calendar_events table
        await queryRunner.query(`
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
            )
        `);

        // Create index for calendar_events
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_calendar_events_user_time" 
            ON "calendar_events" ("user_id", "start_time")
        `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_calendar_events_user_time"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "calendar_events"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_burnout_scores_user_date"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "burnout_scores"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_burnout_thresholds_user"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "burnout_thresholds"`);
    }
}
