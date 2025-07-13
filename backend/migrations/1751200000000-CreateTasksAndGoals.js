import { MigrationInterface, QueryRunner } from 'typeorm';

export default class CreateTasksAndGoals1751200000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL,
        title varchar NOT NULL,
        completed boolean DEFAULT false,
        created_at timestamp DEFAULT now(),
        completed_at timestamp
      );
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS goals (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL,
        title varchar NOT NULL,
        completed boolean DEFAULT false,
        created_at timestamp DEFAULT now(),
        completed_at timestamp
      );
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS tasks;');
    await queryRunner.query('DROP TABLE IF EXISTS goals;');
  }
} 