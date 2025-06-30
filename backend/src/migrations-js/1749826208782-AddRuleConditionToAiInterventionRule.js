"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddRuleConditionToAiInterventionRule1749826208782 = void 0;
class AddRuleConditionToAiInterventionRule1749826208782 {
    constructor() {
        this.name = 'AddRuleConditionToAiInterventionRule1749826208782';
    }
    async up(queryRunner) {
        // Check if column exists before adding
        const table = await queryRunner.getTable("ai_intervention_rule");
        const columnExists = table?.findColumnByName("rule_condition");
        
        if (!columnExists) {
            await queryRunner.query(`ALTER TABLE "ai_intervention_rule" ADD "rule_condition" jsonb NOT NULL DEFAULT '{}'`);
        }
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "ai_intervention_rule" DROP COLUMN IF EXISTS "rule_condition"`);
    }
}
exports.AddRuleConditionToAiInterventionRule1749826208782 = AddRuleConditionToAiInterventionRule1749826208782;
