import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserTable1687015369740 implements MigrationInterface {
    name = 'CreateUserTable1687015369740'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const tableExists = await queryRunner.hasTable("users");
        if (!tableExists) {
            await queryRunner.query(`
                CREATE TABLE "users" (
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
                    CONSTRAINT "UQ_users_email" UNIQUE ("email"),
                    CONSTRAINT "PK_users" PRIMARY KEY ("id")
                )
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "users"`);
    }
} 