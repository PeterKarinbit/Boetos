"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakeUserPasswordNullable1718040300000 = void 0;
class MakeUserPasswordNullable1718040300000 {
    constructor() {
        this.name = 'MakeUserPasswordNullable1718040300000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL`);
    }
}
exports.MakeUserPasswordNullable1718040300000 = MakeUserPasswordNullable1718040300000;
