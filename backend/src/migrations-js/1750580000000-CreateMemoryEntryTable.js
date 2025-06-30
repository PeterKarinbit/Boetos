module.exports = class CreateMemoryEntryTable1750580000000 {
  async up(queryRunner) {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "memory_entries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "content" text NOT NULL,
        "type" varchar NOT NULL DEFAULT 'note',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "nudgePreference" varchar NOT NULL DEFAULT 'daily',
        "snoozedUntil" TIMESTAMP,
        "isArchived" boolean NOT NULL DEFAULT false,
        "isDone" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_memory_entries" PRIMARY KEY ("id"),
        CONSTRAINT "FK_memory_entries_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }
  async down(queryRunner) {
    await queryRunner.query('DROP TABLE IF EXISTS "memory_entries"');
  }
}; 