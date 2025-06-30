const { MigrationInterface, QueryRunner } = require('typeorm');

module.exports = class CreateMentalHealthChecks1710700000000 {
    async up(queryRunner) {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "mental_health_checks" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "mood" integer NOT NULL,
                "stress" integer NOT NULL,
                "sleep" integer NOT NULL,
                "energy" integer NOT NULL,
                "notes" text,
                "risk_score" float NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_mental_health_checks" PRIMARY KEY ("id"),
                CONSTRAINT "FK_mental_health_checks_user" FOREIGN KEY ("user_id") 
                    REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        // Create index for faster queries (only if it doesn't exist)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_mental_health_user_date" 
            ON "mental_health_checks" ("user_id", "created_at")
        `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_mental_health_user_date"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "mental_health_checks"`);
    }
}; 