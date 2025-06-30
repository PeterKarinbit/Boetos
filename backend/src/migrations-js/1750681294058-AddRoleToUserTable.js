const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class AddRoleToUserTable1750681294058 {
    name = 'AddRoleToUserTable1750681294058'

    async up(queryRunner) {
        // Check if the role column already exists
        const columnExists = await queryRunner.hasColumn("users", "role");
        
        if (!columnExists) {
            await queryRunner.query(`
                ALTER TABLE "users" 
                ADD "role" character varying
            `);
            
            await queryRunner.query(`
                COMMENT ON COLUMN "users"."role" IS 'User role (admin, user, etc)'
            `);
        }
    }

    async down(queryRunner) {
        const columnExists = await queryRunner.hasColumn("users", "role");
        
        if (columnExists) {
            await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
        }
    }
} 