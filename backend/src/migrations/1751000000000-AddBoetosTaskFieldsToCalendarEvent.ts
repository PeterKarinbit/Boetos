import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBoetosTaskFieldsToCalendarEvent1751000000000 implements MigrationInterface {
    name = 'AddBoetosTaskFieldsToCalendarEvent1751000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calendar_events" ADD COLUMN IF NOT EXISTS "boetos_task_state" varchar DEFAULT 'active'`);
        await queryRunner.query(`ALTER TABLE "calendar_events" ADD COLUMN IF NOT EXISTS "timer_state" jsonb`);
        await queryRunner.query(`ALTER TABLE "calendar_events" ADD COLUMN IF NOT EXISTS "is_boetos_task" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "calendar_events" ADD COLUMN IF NOT EXISTS "analytics" jsonb`);
        await queryRunner.query(`ALTER TABLE "calendar_events" ADD COLUMN IF NOT EXISTS "reminder_time" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calendar_events" DROP COLUMN IF EXISTS "boetos_task_state"`);
        await queryRunner.query(`ALTER TABLE "calendar_events" DROP COLUMN IF EXISTS "timer_state"`);
        await queryRunner.query(`ALTER TABLE "calendar_events" DROP COLUMN IF EXISTS "is_boetos_task"`);
        await queryRunner.query(`ALTER TABLE "calendar_events" DROP COLUMN IF EXISTS "analytics"`);
        await queryRunner.query(`ALTER TABLE "calendar_events" DROP COLUMN IF EXISTS "reminder_time"`);
    }
} 