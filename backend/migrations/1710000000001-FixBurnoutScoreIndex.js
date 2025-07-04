const { MigrationInterface, QueryRunner } = require('typeorm');

module.exports = class FixBurnoutScoreIndex1710000000001 {
  async up(queryRunner) {
    try {
      // Check if the index exists
      const indexExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1
          FROM pg_indexes
          WHERE indexname = 'IDX_BURNOUT_SCORE_USER_DATE'
        );
      `);

      if (indexExists[0].exists) {
        console.log('Index exists, attempting to drop...');
        // Drop the existing index
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_BURNOUT_SCORE_USER_DATE";`);
        console.log('Index dropped successfully');
      }

      // Wait a moment to ensure the drop is complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create the index again
      console.log('Creating new index...');
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_BURNOUT_SCORE_USER_DATE" 
        ON "burnout_score" ("userId", "date");
      `);
      console.log('New index created successfully');
    } catch (error) {
      console.error('Error in migration:', error);
      throw error;
    }
  }

  async down(queryRunner) {
    try {
      await queryRunner.query(`DROP INDEX IF EXISTS "IDX_BURNOUT_SCORE_USER_DATE";`);
    } catch (error) {
      console.error('Error in migration down:', error);
      throw error;
    }
  }
}; 