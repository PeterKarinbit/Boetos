const { MigrationInterface, QueryRunner, Table, TableIndex } = require("typeorm");

module.exports = class CreateNotificationsTable1750600000002 {
    name = 'CreateNotificationsTable1750600000002'

    async up(queryRunner) {
        // First check if the table exists
        const tableExists = await queryRunner.hasTable("notifications");
        if (!tableExists) {
            await queryRunner.createTable(
                new Table({
                    name: "notifications",
                    columns: [
                        {
                            name: "id",
                            type: "uuid",
                            isPrimary: true,
                            generationStrategy: "uuid",
                            default: "uuid_generate_v4()"
                        },
                        {
                            name: "user_id",
                            type: "uuid",
                            isNullable: false
                        },
                        {
                            name: "title",
                            type: "varchar",
                            isNullable: false
                        },
                        {
                            name: "message",
                            type: "text",
                            isNullable: false
                        },
                        {
                            name: "type",
                            type: "varchar",
                            isNullable: false
                        },
                        {
                            name: "read",
                            type: "boolean",
                            default: false
                        },
                        {
                            name: "data",
                            type: "jsonb",
                            isNullable: true
                        },
                        {
                            name: "created_at",
                            type: "timestamp",
                            default: "now()"
                        },
                        {
                            name: "updated_at",
                            type: "timestamp",
                            default: "now()"
                        }
                    ]
                }),
                true
            );
        }

        // Robust index existence check
        const userReadIndexExists = await queryRunner.query(`
            SELECT 1 FROM pg_indexes 
            WHERE indexname = 'IDX_NOTIFICATION_USER_READ'
        `);
        // Log for debugging
        console.log('IDX_NOTIFICATION_USER_READ existence:', userReadIndexExists);
        if (!userReadIndexExists || !Array.isArray(userReadIndexExists) || userReadIndexExists.length === 0) {
            await queryRunner.createIndex("notifications", new TableIndex({ 
                name: "IDX_NOTIFICATION_USER_READ", 
                columnNames: ["user_id", "read"] 
            }));
        }

        const createdAtIndexExists = await queryRunner.query(`
            SELECT 1 FROM pg_indexes 
            WHERE indexname = 'IDX_NOTIFICATION_CREATED_AT'
        `);
        console.log('IDX_NOTIFICATION_CREATED_AT existence:', createdAtIndexExists);
        if (!createdAtIndexExists || !Array.isArray(createdAtIndexExists) || createdAtIndexExists.length === 0) {
            await queryRunner.createIndex("notifications", new TableIndex({ 
                name: "IDX_NOTIFICATION_CREATED_AT", 
                columnNames: ["created_at"] 
            }));
        }
        
        // Check if foreign key exists before creating it
        const foreignKeyExists = await queryRunner.query(`
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'FK_notifications_user_id'
            AND table_name = 'notifications'
        `);
        if (!foreignKeyExists || !Array.isArray(foreignKeyExists) || foreignKeyExists.length === 0) {
            await queryRunner.query(`
                ALTER TABLE "notifications" 
                ADD CONSTRAINT "FK_notifications_user_id" 
                FOREIGN KEY ("user_id") 
                REFERENCES "users"("id") 
                ON DELETE CASCADE
            `);
        }
    }

    async down(queryRunner) {
        // Drop foreign key if it exists
        const foreignKeyExists = await queryRunner.query(`
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'FK_notifications_user_id'
            AND table_name = 'notifications'
        `);
        if (foreignKeyExists && Array.isArray(foreignKeyExists) && foreignKeyExists.length > 0) {
            await queryRunner.query(`
                ALTER TABLE "notifications" 
                DROP CONSTRAINT "FK_notifications_user_id"
            `);
        }

        // Drop indexes if they exist
        const userReadIndexExists = await queryRunner.query(`
            SELECT 1 FROM pg_indexes 
            WHERE indexname = 'IDX_NOTIFICATION_USER_READ'
        `);
        if (userReadIndexExists && Array.isArray(userReadIndexExists) && userReadIndexExists.length > 0) {
            await queryRunner.dropIndex("notifications", "IDX_NOTIFICATION_USER_READ");
        }

        const createdAtIndexExists = await queryRunner.query(`
            SELECT 1 FROM pg_indexes 
            WHERE indexname = 'IDX_NOTIFICATION_CREATED_AT'
        `);
        if (createdAtIndexExists && Array.isArray(createdAtIndexExists) && createdAtIndexExists.length > 0) {
            await queryRunner.dropIndex("notifications", "IDX_NOTIFICATION_CREATED_AT");
        }

        // Drop table if it exists
        if (await queryRunner.hasTable("notifications")) {
            await queryRunner.dropTable("notifications");
        }
    }
} 