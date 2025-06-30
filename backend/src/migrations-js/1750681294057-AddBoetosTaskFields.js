const { MigrationInterface, QueryRunner } = require("typeorm");

class AddBoetosTaskFields1750681294057 {
    name = 'AddBoetosTaskFields1750681294057'

    async up(queryRunner) {
        // Add boetos_task_state column if it does not exist
        const boetosTaskStateCol = await queryRunner.query(`
            SELECT column_name FROM information_schema.columns WHERE table_name = 'calendar_events' AND column_name = 'boetos_task_state';
        `);
        console.log('boetos_task_state column existence:', boetosTaskStateCol);
        if (!boetosTaskStateCol || !Array.isArray(boetosTaskStateCol) || boetosTaskStateCol.length === 0) {
            await queryRunner.query(`
                ALTER TABLE "calendar_events"
                ADD "boetos_task_state" character varying DEFAULT 'active'
            `);
            await queryRunner.query(`
                COMMENT ON COLUMN "calendar_events"."boetos_task_state" IS 'State of Boetos Task (active, paused, completed, cancelled)'
            `);
        }

        // Add timer_state column if it does not exist
        const timerStateCol = await queryRunner.query(`
            SELECT column_name FROM information_schema.columns WHERE table_name = 'calendar_events' AND column_name = 'timer_state';
        `);
        console.log('timer_state column existence:', timerStateCol);
        if (!timerStateCol || !Array.isArray(timerStateCol) || timerStateCol.length === 0) {
            await queryRunner.query(`
                ALTER TABLE "calendar_events"
                ADD "timer_state" jsonb
            `);
            await queryRunner.query(`
                COMMENT ON COLUMN "calendar_events"."timer_state" IS 'Timer state for Boetos Task (remaining, lastStarted, pausedAt, etc)'
            `);
        }

        // Add is_boetos_task column if it does not exist
        const isBoetosTaskCol = await queryRunner.query(`
            SELECT column_name FROM information_schema.columns WHERE table_name = 'calendar_events' AND column_name = 'is_boetos_task';
        `);
        console.log('is_boetos_task column existence:', isBoetosTaskCol);
        if (!isBoetosTaskCol || !Array.isArray(isBoetosTaskCol) || isBoetosTaskCol.length === 0) {
            await queryRunner.query(`
                ALTER TABLE "calendar_events"
                ADD "is_boetos_task" boolean NOT NULL DEFAULT false
            `);
            await queryRunner.query(`
                COMMENT ON COLUMN "calendar_events"."is_boetos_task" IS 'True if this event is a Boetos Task'
            `);
        }

        // Add analytics column if it does not exist
        const analyticsCol = await queryRunner.query(`
            SELECT column_name FROM information_schema.columns WHERE table_name = 'calendar_events' AND column_name = 'analytics';
        `);
        console.log('analytics column existence:', analyticsCol);
        if (!analyticsCol || !Array.isArray(analyticsCol) || analyticsCol.length === 0) {
            await queryRunner.query(`
                ALTER TABLE "calendar_events"
                ADD "analytics" jsonb
            `);
            await queryRunner.query(`
                COMMENT ON COLUMN "calendar_events"."analytics" IS 'Analytics for Boetos Task (startedAt, completedAt, cancelledAt, etc)'
            `);
        }

        // Add reminder_time column if it does not exist
        const reminderTimeCol = await queryRunner.query(`
            SELECT column_name FROM information_schema.columns WHERE table_name = 'calendar_events' AND column_name = 'reminder_time';
        `);
        console.log('reminder_time column existence:', reminderTimeCol);
        if (!reminderTimeCol || !Array.isArray(reminderTimeCol) || reminderTimeCol.length === 0) {
            await queryRunner.query(`
                ALTER TABLE "calendar_events"
                ADD "reminder_time" TIMESTAMP
            `);
            await queryRunner.query(`
                COMMENT ON COLUMN "calendar_events"."reminder_time" IS 'Reminder time for Boetos Task'
            `);
        }
    }

    async down(queryRunner) {
        await queryRunner.query(`
            ALTER TABLE "calendar_events" DROP COLUMN "reminder_time"
        `);
        await queryRunner.query(`
            ALTER TABLE "calendar_events" DROP COLUMN "analytics"
        `);
        await queryRunner.query(`
            ALTER TABLE "calendar_events" DROP COLUMN "is_boetos_task"
        `);
        await queryRunner.query(`
            ALTER TABLE "calendar_events" DROP COLUMN "timer_state"
        `);
        await queryRunner.query(`
            ALTER TABLE "calendar_events" DROP COLUMN "boetos_task_state"
        `);
    }
}

module.exports = AddBoetosTaskFields1750681294057; 