import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserPreferencesTable1718039600000 implements MigrationInterface {
    name = 'CreateUserPreferencesTable1718039600000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if table exists
        const tableExists = await queryRunner.hasTable("user_preferences");
        
        if (!tableExists) {
            await queryRunner.query(`
                CREATE TABLE "user_preferences" (
                    "id" SERIAL NOT NULL,
                    "user_id" integer NOT NULL,
                    "preferred_channel" character varying NOT NULL,
                    "quiet_hours_start" character varying,
                    "quiet_hours_end" character varying,
                    "reminder_frequency" integer,
                    "tone_preference" character varying NOT NULL,
                    "auto_track_categories" text[] NOT NULL,
                    "enable_ai_interventions" boolean NOT NULL,
                    "preferred_intervention_method" character varying,
                    "ai_tone_preference" jsonb,
                    "custom_intervention_messages" jsonb,
                    "ai_onboarding_memory" jsonb,
                    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_user_preferences" PRIMARY KEY ("id"),
                    CONSTRAINT "FK_user_preferences_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
                )
            `);
        } else {
            console.log('Table user_preferences already exists, skipping creation');
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const tableExists = await queryRunner.hasTable("user_preferences");
        if (tableExists) {
            await queryRunner.query(`DROP TABLE "user_preferences"`);
        }
    }
} 