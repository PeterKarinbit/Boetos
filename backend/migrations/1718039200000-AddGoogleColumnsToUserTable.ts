import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleColumnsToUserTable1718039200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "google_id" character varying`);
        await queryRunner.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "google_access_token" character varying`);
        await queryRunner.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "google_refresh_token" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "User" DROP COLUMN IF EXISTS "google_id"`);
        await queryRunner.query(`ALTER TABLE "User" DROP COLUMN IF EXISTS "google_access_token"`);
        await queryRunner.query(`ALTER TABLE "User" DROP COLUMN IF EXISTS "google_refresh_token"`);
    }
}
