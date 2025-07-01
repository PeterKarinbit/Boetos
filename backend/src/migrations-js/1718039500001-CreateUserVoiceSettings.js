const { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } = require('typeorm');

class CreateUserVoiceSettings1687015369742 {
    async up(queryRunner) {
        // First check if the table exists
        const tableExists = await queryRunner.hasTable("user_voice_settings");
        if (!tableExists) {
            await queryRunner.createTable(
                new Table({
                    name: "user_voice_settings",
                    columns: [
                        {
                            name: "id",
                            type: "uuid",
                            isPrimary: true,
                            generationStrategy: "uuid",
                            default: "uuid_generate_v4()",
                        },
                        {
                            name: "user_id",
                            type: "uuid",
                            isNullable: false,
                        },
                        {
                            name: "voice_model",
                            type: "varchar",
                            isNullable: true,
                        },
                        {
                            name: "voice_id",
                            type: "varchar",
                            isNullable: true,
                        },
                        {
                            name: "voice_enabled",
                            type: "boolean",
                            default: false,
                        },
                        {
                            name: "voice_language",
                            type: "varchar",
                            isNullable: true,
                        },
                        {
                            name: "voice_speed",
                            type: "float",
                            default: 1.0,
                        },
                        {
                            name: "voice_pitch",
                            type: "float",
                            default: 1.0,
                        },
                        {
                            name: "voice_volume",
                            type: "float",
                            default: 1.0,
                        },
                        {
                            name: "voice_gender",
                            type: "varchar",
                            isNullable: true,
                        },
                        {
                            name: "voice_accent",
                            type: "varchar",
                            isNullable: true,
                        },
                        {
                            name: "voice_style",
                            type: "varchar",
                            isNullable: true,
                        },
                        {
                            name: "voice_emotion",
                            type: "varchar",
                            isNullable: true,
                        },
                        {
                            name: "voice_background",
                            type: "varchar",
                            isNullable: true,
                        },
                        {
                            name: "created_at",
                            type: "timestamp",
                            default: "CURRENT_TIMESTAMP",
                        },
                        {
                            name: "updated_at",
                            type: "timestamp",
                            default: "CURRENT_TIMESTAMP",
                        },
                    ],
                }),
                true
            );
        }

        // Check if foreign key exists before creating
        const foreignKeyExists = await queryRunner.query(`
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'FK_4aa4bb4b5412d6b040ef5089a9c'
            AND table_name = 'user_voice_settings'
        `);

        if (foreignKeyExists.length === 0) {
            await queryRunner.createForeignKey(
                "user_voice_settings",
                new TableForeignKey({
                    columnNames: ["user_id"],
                    referencedColumnNames: ["id"],
                    referencedTableName: "users",
                    onDelete: "CASCADE",
                    name: "FK_4aa4bb4b5412d6b040ef5089a9c"
                })
            );
        }

        // Check if index exists before creating
        const indexExists = await queryRunner.query(`
            SELECT 1 FROM pg_indexes 
            WHERE indexname = 'IDX_4aa4bb4b5412d6b040ef5089a9'
        `);

        if (indexExists.length === 0) {
            try {
                await queryRunner.createIndex(
                    "user_voice_settings",
                    new TableIndex({
                        name: "IDX_4aa4bb4b5412d6b040ef5089a9",
                        columnNames: ["user_id"],
                        isUnique: true,
                    })
                );
            } catch (error) {
                console.warn('Warning: Failed to create index on user_voice_settings. Error:', error.message);
                // Continue with migration even if index creation fails
            }
        }
    }

    async down(queryRunner) {
        // Drop index if it exists
        const indexExists = await queryRunner.query(`
            SELECT 1 FROM pg_indexes 
            WHERE indexname = 'IDX_4aa4bb4b5412d6b040ef5089a9'
        `);

        if (indexExists.length > 0) {
            try {
                await queryRunner.dropIndex("user_voice_settings", "IDX_4aa4bb4b5412d6b040ef5089a9");
            } catch (error) {
                console.warn('Warning: Failed to drop index on user_voice_settings. Error:', error.message);
            }
        }

        // Drop foreign key if it exists
        const foreignKeyExists = await queryRunner.query(`
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'FK_4aa4bb4b5412d6b040ef5089a9c'
            AND table_name = 'user_voice_settings'
        `);

        if (foreignKeyExists.length > 0) {
            await queryRunner.query(`
                ALTER TABLE "user_voice_settings"
                DROP CONSTRAINT "FK_4aa4bb4b5412d6b040ef5089a9c"
            `);
        }

        // Drop table if it exists
        if (await queryRunner.hasTable("user_voice_settings")) {
            await queryRunner.dropTable("user_voice_settings");
        }
    }
}

module.exports = CreateUserVoiceSettings1687015369742;
