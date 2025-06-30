"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateUserPreferencesTable1718039700000 = void 0;
class UpdateUserPreferencesTable1718039700000 {
    constructor() {
        this.name = 'UpdateUserPreferencesTable1718039700000';
    }
    async up(queryRunner) {
        // Check if table exists
        const tableExists = await queryRunner.hasTable("user_preferences");
        if (tableExists) {
            // Add any missing columns
            const columns = await queryRunner.getTable("user_preferences");
            const columnNames = (columns === null || columns === void 0 ? void 0 : columns.columns.map(col => col.name)) || [];
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
    async down(queryRunner) {
        // No down migration needed as we're only adding columns
    }
}
exports.UpdateUserPreferencesTable1718039700000 = UpdateUserPreferencesTable1718039700000;
