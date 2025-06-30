import { MigrationInterface, QueryRunner } from "typeorm";

export class RemovePasswordFieldFromUser20250701 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "password" character varying`);
    }
} 