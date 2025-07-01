const { AppDataSource } = require('../data-source');
const { User } = require('../entities/User');
const { UserPreferences } = require('../entities/UserPreferences');
const bcrypt = require('bcryptjs');

const initializeDatabase = async () => {
  try {
    // Initialize the connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Run migrations instead of synchronize
    await AppDataSource.runMigrations();
    console.log('Database migrations applied');

    // Check if we need to create default data
    const userRepository = AppDataSource.getRepository(User);
    const existingUsers = await userRepository.find();

    // You can add more initialization logic here if needed

  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

module.exports = initializeDatabase;
