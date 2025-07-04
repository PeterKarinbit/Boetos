import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateUserVoiceSettings1750136047833 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "user_voice_settings",
                columns: [
                    { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
                    { name: "user_id", type: "uuid", isNullable: false },
                    { name: "voice_model", type: "varchar", isNullable: true },
                    { name: "voice_id", type: "varchar", isNullable: true },
                    { name: "voice_enabled", type: "boolean", default: false },
                    { name: "voice_language", type: "varchar", isNullable: true },
                    { name: "voice_speed", type: "float", default: 1.0 },
                    { name: "voice_pitch", type: "float", default: 1.0 },
                    { name: "voice_volume", type: "float", default: 1.0 },
                    { name: "voice_gender", type: "varchar", isNullable: true },
                    { name: "voice_accent", type: "varchar", isNullable: true },
                    { name: "voice_style", type: "varchar", isNullable: true },
                    { name: "voice_emotion", type: "varchar", isNullable: true },
                    { name: "voice_background", type: "varchar", isNullable: true },
                    { name: "created_at", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                    { name: "updated_at", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                ],
            }),
            true
        );
        await queryRunner.createForeignKey(
            "user_voice_settings",
            new TableForeignKey({
                columnNames: ["user_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "CASCADE",
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("user_voice_settings");
        if (table) {
            for (const fk of table.foreignKeys) {
                if (fk.columnNames.indexOf("user_id") !== -1) {
                    await queryRunner.dropForeignKey("user_voice_settings", fk);
                }
            }
        }
        await queryRunner.dropTable("user_voice_settings");
    }

}
