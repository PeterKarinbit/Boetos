module.exports = {
  async up(queryRunner) {
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
  },
  async down(queryRunner) {
    await queryRunner.query('DROP TABLE IF EXISTS chat_messages;');
  }
}; 