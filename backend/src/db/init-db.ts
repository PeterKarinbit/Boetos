import { initializeDatabase } from './init.js';

(async () => {
  try {
    await initializeDatabase();
    console.log('Database tables created successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
})(); 