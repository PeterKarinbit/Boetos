require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { AppDataSource } = require('../data-source');

async function backupData() {
  try {
    // Initialize the data source
    await AppDataSource.initialize();
    console.log('Connected to database');

    // Get all tables
    const tables = await AppDataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);

    // Create backup object
    const backup = {};

    // Backup each table
    for (const table of tables) {
      const tableName = table.table_name;
      console.log(`Backing up table: ${tableName}`);
      const data = await AppDataSource.query(`SELECT * FROM "${tableName}"`);
      backup[tableName] = data;
    }

    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(__dirname, `../../backup-${timestamp}.json`);

    // Write backup to file
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    console.log(`Backup completed successfully: ${backupFile}`);

  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

backupData(); 