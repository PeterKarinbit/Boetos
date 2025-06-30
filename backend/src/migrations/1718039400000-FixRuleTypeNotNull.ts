import { MigrationInterface, QueryRunner } from "typeorm";

export class FixRuleTypeNotNull1718039400000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add the column as nullable
        await queryRunner.query(`ALTER TABLE "ai_intervention_rule" ADD COLUMN IF NOT EXISTS "rule_type" character varying`);
        // 2. Set a default value for all existing rows
        await queryRunner.query(`UPDATE "ai_intervention_rule" SET "rule_type" = 'default_rule' WHERE "rule_type" IS NULL`);
        // 3. Alter the column to be NOT NULL
        await queryRunner.query(`ALTER TABLE "ai_intervention_rule" ALTER COLUMN "rule_type" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Rollback: make the column nullable again (or drop if desired)
        await queryRunner.query(`ALTER TABLE "ai_intervention_rule" ALTER COLUMN "rule_type" DROP NOT NULL`);
    }
}
