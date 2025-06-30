import { MigrationInterface, QueryRunner, Table, Index } from "typeorm";

export class CreateNotificationsTable1750600000002 implements MigrationInterface {
    name = 'CreateNotificationsTable1750600000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
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

        // Create indexes
        await queryRunner.createIndex("notifications", new Index("IDX_NOTIFICATION_USER_READ", ["user_id", "read"]));
        await queryRunner.createIndex("notifications", new Index("IDX_NOTIFICATION_CREATED_AT", ["created_at"]));
        
        // Add foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "notifications" 
            ADD CONSTRAINT "FK_notifications_user_id" 
            FOREIGN KEY ("user_id") 
            REFERENCES "users"("id") 
            ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("notifications");
    }
} 