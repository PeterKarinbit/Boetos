import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRuleConditionToAiInterventionRule1749826208782 implements MigrationInterface {
    name = 'AddRuleConditionToAiInterventionRule1749826208782';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ai_intervention_rule" ADD "rule_condition" jsonb NOT NULL DEFAULT '{}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ai_intervention_rule" DROP COLUMN "rule_condition"`);
    }
} 