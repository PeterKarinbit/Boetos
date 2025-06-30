const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class AddCompanyAndBioToUserTable1750681294059 {
    name = 'AddCompanyAndBioToUserTable1750681294059'

    async up(queryRunner) {
        // Check if the company column already exists
        const companyExists = await queryRunner.hasColumn("users", "company");
        const bioExists = await queryRunner.hasColumn("users", "bio");
        
        if (!companyExists) {
            await queryRunner.query(`
                ALTER TABLE "users" 
                ADD "company" character varying
            `);
            
            await queryRunner.query(`
                COMMENT ON COLUMN "users"."company" IS 'User company or organization'
            `);
        }
        
        if (!bioExists) {
            await queryRunner.query(`
                ALTER TABLE "users" 
                ADD "bio" text
            `);
            
            await queryRunner.query(`
                COMMENT ON COLUMN "users"."bio" IS 'User biography or description'
            `);
        }
    }

    async down(queryRunner) {
        const companyExists = await queryRunner.hasColumn("users", "company");
        const bioExists = await queryRunner.hasColumn("users", "bio");
        
        if (bioExists) {
            await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "bio"`);
        }
        
        if (companyExists) {
            await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "company"`);
        }
    }
} 