import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProfileFieldsToUserTable1751300000000 implements MigrationInterface {
    name = 'AddProfileFieldsToUserTable1751300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add role field
        await queryRunner.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" character varying`);
        
        // Add company field
        await queryRunner.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "company" character varying`);
        
        // Add bio field
        await queryRunner.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the added columns
        await queryRunner.query(`ALTER TABLE "User" DROP COLUMN IF EXISTS "bio"`);
        await queryRunner.query(`ALTER TABLE "User" DROP COLUMN IF EXISTS "company"`);
        await queryRunner.query(`ALTER TABLE "User" DROP COLUMN IF EXISTS "role"`);
    }
} 