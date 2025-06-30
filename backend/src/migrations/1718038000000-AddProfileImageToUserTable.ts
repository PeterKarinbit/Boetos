import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfileImageToUserTable1718038000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profile_image" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "User" DROP COLUMN IF EXISTS "profile_image"`);
    }
}
