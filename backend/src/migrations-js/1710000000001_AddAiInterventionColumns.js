"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAiInterventionColumns1710000000001 = void 0;
class AddAiInterventionColumns1710000000001 {
    constructor() {
        this.name = 'AddAiInterventionColumns1710000000001';
    }
    async up(queryRunner) {
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='ai_intervention_rule' AND column_name='intervention_method'
                ) THEN
                    ALTER TABLE "ai_intervention_rule" ADD "intervention_method" character varying;
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='ai_intervention_rule' AND column_name='intervention_message_template'
                ) THEN
                    ALTER TABLE "ai_intervention_rule" ADD "intervention_message_template" text;
                END IF;
            END
            $$;
        `);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "ai_intervention_rule" DROP COLUMN "intervention_message_template"`);
        await queryRunner.query(`ALTER TABLE "ai_intervention_rule" DROP COLUMN "intervention_method"`);
    }
}
exports.AddAiInterventionColumns1710000000001 = AddAiInterventionColumns1710000000001;
