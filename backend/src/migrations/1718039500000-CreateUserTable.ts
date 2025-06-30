import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserTable1718039500000 implements MigrationInterface {
    name = 'CreateUserTable1718039500000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const tableExists = await queryRunner.hasTable("User");
        if (!tableExists) {
            await queryRunner.query(`
                CREATE TABLE "User" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "email" character varying NOT NULL,
                    "password" character varying,
                    "name" character varying NOT NULL,
                    "profile_image" character varying,
                    "avatar" character varying,
                    "preferences" jsonb,
                    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                    "google_id" character varying,
                    "google_access_token" character varying,
                    "google_refresh_token" character varying,
                    CONSTRAINT "UQ_User_email" UNIQUE ("email"),
                    CONSTRAINT "PK_User" PRIMARY KEY ("id")
                )
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "User"`);
    }
} 