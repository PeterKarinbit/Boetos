import { MigrationInterface, QueryRunner } from 'typeorm';

export default class CreateChatMessages1751201000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL,
        content text NOT NULL,
        sender varchar NOT NULL,
        created_at timestamp DEFAULT now(),
        session_id uuid
      );
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS chat_messages;');
  }
} 