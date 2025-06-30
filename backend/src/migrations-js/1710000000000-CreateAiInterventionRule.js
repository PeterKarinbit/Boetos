"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAiInterventionRule1710000000000 = void 0;
class CreateAiInterventionRule1710000000000 {
    constructor() {
        this.name = 'CreateAiInterventionRule1710000000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`
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
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "ai_intervention_rule"`);
    }
}
exports.CreateAiInterventionRule1710000000000 = CreateAiInterventionRule1710000000000;
