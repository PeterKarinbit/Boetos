const { AppDataSource, initializeDataSource } = require('./data-source');

async function resetDatabase() {
    try {
        // Initialize the data source with robust connection handling
        await initializeDataSource();
        console.log('Connected to database');

        const queryRunner = AppDataSource.createQueryRunner();

        // Explicitly drop the migrations table first, if it exists
        console.log('Dropping migrations table (if exists)...');
        await queryRunner.query(`DROP TABLE IF EXISTS "migrations" CASCADE`);
        console.log('Migrations table dropped.');

        // Drop all sequences first to prevent duplicate key errors
        console.log('Dropping all sequences...');
        await queryRunner.query(`
            DO $$ DECLARE
                r RECORD;
            BEGIN
                FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
                    EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE';
                END LOOP;
            END $$;
        `);
        console.log('Dropped all sequences');

        // Drop all tables (excluding system tables)
        console.log('Dropping all tables...');
        await queryRunner.query(`
            DO $$ DECLARE
                r RECORD;
            BEGIN
                FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                    EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
                END LOOP;
            END $$;
        `);
        console.log('Dropped all tables');

        console.log('Running migrations...');
        await AppDataSource.runMigrations();
        console.log('Migrations completed successfully.');

        console.log('Database reset complete!');

    } catch (error) {
        console.error('Error during database reset:', error);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
            console.log('Database connection closed.');
        }
    }
}

resetDatabase(); 