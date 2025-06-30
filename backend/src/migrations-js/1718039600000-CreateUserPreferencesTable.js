"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUserPreferencesTable1718039600000 = void 0;
const { MigrationInterface, QueryRunner } = require('typeorm');

class CreateUserPreferencesTable1718039600000 {
    constructor() {
        this.name = 'CreateUserPreferencesTable1718039600000';
    }
    async up(queryRunner) {
        // Create user_preferences table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "user_preferences" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "theme" character varying DEFAULT 'light',
                "notifications_enabled" boolean DEFAULT true,
                "language" character varying DEFAULT 'en',
                "timezone" character varying DEFAULT 'UTC',
                "work_hours_start" time,
                "work_hours_end" time,
                "break_duration" integer DEFAULT 15,
                "focus_block_duration" integer DEFAULT 25,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_user_preferences" PRIMARY KEY ("id"),
                CONSTRAINT "FK_user_preferences_user" FOREIGN KEY ("user_id") 
                    REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        // Create unique index for user preferences
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_user_preferences_user_id" 
            ON "user_preferences" ("user_id")
        `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_preferences_user_id"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "user_preferences"`);
    }
}
exports.CreateUserPreferencesTable1718039600000 = CreateUserPreferencesTable1718039600000;
