import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBoetosTaskFieldsToCalendarEvent1719000000000 implements MigrationInterface {
    name = 'AddBoetosTaskFieldsToCalendarEvent1719000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "calendar_events"
            ADD "boetos_task_state" VARCHAR(32),
            ADD "timer_state" JSONB,
            ADD "is_boetos_task" BOOLEAN DEFAULT false,
            ADD "analytics" JSONB,
            ADD "reminder_time" TIMESTAMP
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "calendar_events"
            DROP COLUMN "boetos_task_state",
            DROP COLUMN "timer_state",
            DROP COLUMN "is_boetos_task",
            DROP COLUMN "analytics",
            DROP COLUMN "reminder_time"
        `);
    }
} 