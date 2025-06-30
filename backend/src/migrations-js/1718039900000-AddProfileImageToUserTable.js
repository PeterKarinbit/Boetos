"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddProfileImageToUserTable1718039900000 = void 0;
class AddProfileImageToUserTable1718039900000 {
    constructor() {
        this.name = 'AddProfileImageToUserTable1718039900000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile_image" character varying`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "profile_image"`);
    }
}
exports.AddProfileImageToUserTable1718039900000 = AddProfileImageToUserTable1718039900000;
