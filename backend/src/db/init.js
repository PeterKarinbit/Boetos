const { AppDataSource } = require('../data-source');
const { User } = require('../entities/User');
const { UserPreferences } = require('../entities/UserPreferences');
const bcrypt = require('bcryptjs');

const initializeDatabase = async () => {
  try {
    // Run migrations instead of synchronize
    await AppDataSource.runMigrations();
    console.log('Database migrations applied');

    // Check if we need to create default data
    const userRepository = AppDataSource.getRepository(User);
    const existingUsers = await userRepository.find();
    
    if (existingUsers.length === 0) {
      console.log('Creating default user...');
      const hashedPassword = await bcrypt.hash('password123', 10);

      const defaultUser = userRepository.create({
        email: 'demo@example.com',
        name: 'Demo User',
        googleId: 'demo123',
        isActive: true,
        password: hashedPassword,
      });
      await userRepository.save(defaultUser);

      // Create default preferences for the demo user
      const preferencesRepository = AppDataSource.getRepository(UserPreferences);
      const defaultPreferences = preferencesRepository.create({
        userId: defaultUser.id,
        theme: 'light',
        notificationsEnabled: true,
        language: 'en',
        timezone: 'UTC'
      });
      await preferencesRepository.save(defaultPreferences);

      console.log('Default user and preferences created');
    }

    console.log('Database initialization completed');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

module.exports = { initializeDatabase }; 