"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddGoogleColumnsToUserTable1718040200000 = void 0;
class AddGoogleColumnsToUserTable1718040200000 {
    constructor() {
        this.name = 'AddGoogleColumnsToUserTable1718040200000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "google_id" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "google_access_token" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "google_refresh_token" character varying`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "google_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "google_access_token"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "google_refresh_token"`);
    }
}
exports.AddGoogleColumnsToUserTable1718040200000 = AddGoogleColumnsToUserTable1718040200000;
