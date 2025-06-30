"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUserTable1718039500000 = void 0;
const { MigrationInterface, QueryRunner } = require('typeorm');

class CreateUserTable1718039500000 {
    constructor() {
        this.name = 'CreateUserTable1718039500000';
    }
    async up(queryRunner) {
        // Create users table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "name" character varying NOT NULL,
                "password" character varying,
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_users" PRIMARY KEY ("id")
            )
        `);

        // Create unique index for email
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_users_email" 
            ON "users" ("email")
        `);

        // Create index for active users
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_users_active" 
            ON "users" ("is_active")
        `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_active"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_email"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    }
}
exports.CreateUserTable1718039500000 = CreateUserTable1718039500000;
