import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiInterventionRule1710000000000 implements MigrationInterface {
    name = 'CreateAiInterventionRule1710000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
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

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "ai_intervention_rule"`);
    }
} 