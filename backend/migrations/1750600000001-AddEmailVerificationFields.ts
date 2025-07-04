import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailVerificationFields1750600000001 implements MigrationInterface {
    name = 'AddEmailVerificationFields1750600000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN "email_verified" boolean NOT NULL DEFAULT false,
            ADD COLUMN "email_verification_token" character varying,
            ADD COLUMN "email_verification_expires" TIMESTAMP
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN "email_verified",
            DROP COLUMN "email_verification_token",
            DROP COLUMN "email_verification_expires"
        `);
    }
} 