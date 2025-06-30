import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserPreferencesTable1718039700000 implements MigrationInterface {
    name = 'UpdateUserPreferencesTable1718039700000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if table exists
        const tableExists = await queryRunner.hasTable("user_preferences");
        
        if (tableExists) {
            // Add any missing columns
            const columns = await queryRunner.getTable("user_preferences");
            const columnNames = columns?.columns.map(col => col.name) || [];

            // Add missing columns if they don't exist
            if (!columnNames.includes("ai_tone_preference")) {
                await queryRunner.query(`ALTER TABLE "user_preferences" ADD COLUMN "ai_tone_preference" jsonb`);
            }
            if (!columnNames.includes("custom_intervention_messages")) {
                await queryRunner.query(`ALTER TABLE "user_preferences" ADD COLUMN "custom_intervention_messages" jsonb`);
            }
            if (!columnNames.includes("ai_onboarding_memory")) {
                await queryRunner.query(`ALTER TABLE "user_preferences" ADD COLUMN "ai_onboarding_memory" jsonb`);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No down migration needed as we're only adding columns
    }
} 