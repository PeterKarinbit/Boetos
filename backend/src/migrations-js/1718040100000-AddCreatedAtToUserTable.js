"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCreatedAtToUserTable1718040100000 = void 0;
class AddCreatedAtToUserTable1718040100000 {
    constructor() {
        this.name = 'AddCreatedAtToUserTable1718040100000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now()`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "created_at"`);
    }
}
exports.AddCreatedAtToUserTable1718040100000 = AddCreatedAtToUserTable1718040100000;
