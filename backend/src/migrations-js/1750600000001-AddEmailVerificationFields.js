"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddEmailVerificationFields1750600000001 = void 0;

class AddEmailVerificationFields1750600000001 {
    constructor() {
        this.name = 'AddEmailVerificationFields1750600000001';
    }

    async up(queryRunner) {
        // Add email_verified column if it does not exist
        const emailVerifiedCol = await queryRunner.query(`
            SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verified';
        `);
        // Log for debugging
        console.log('email_verified column existence:', emailVerifiedCol);
        if (!emailVerifiedCol || !Array.isArray(emailVerifiedCol) || emailVerifiedCol.length === 0) {
            await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "email_verified" boolean NOT NULL DEFAULT false;`);
        }
        // Add email_verification_token column if it does not exist
        const emailTokenCol = await queryRunner.query(`
            SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verification_token';
        `);
        console.log('email_verification_token column existence:', emailTokenCol);
        if (!emailTokenCol || !Array.isArray(emailTokenCol) || emailTokenCol.length === 0) {
            await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "email_verification_token" character varying;`);
        }
        // Add email_verification_expires column if it does not exist
        const emailExpiresCol = await queryRunner.query(`
            SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verification_expires';
        `);
        console.log('email_verification_expires column existence:', emailExpiresCol);
        if (!emailExpiresCol || !Array.isArray(emailExpiresCol) || emailExpiresCol.length === 0) {
            await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "email_verification_expires" TIMESTAMP;`);
        }
    }

    async down(queryRunner) {
        await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN "email_verified",
            DROP COLUMN "email_verification_token",
            DROP COLUMN "email_verification_expires"
        `);
    }
}

exports.AddEmailVerificationFields1750600000001 = AddEmailVerificationFields1750600000001; 