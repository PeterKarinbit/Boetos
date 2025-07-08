import 'dotenv/config';
import { dataSource } from '../data-source-new.js';
import { User } from '../entities/User.js';
import { UserPreferences } from '../entities/UserPreferences.js';
import { AiInterventionRule } from '../entities/AiInterventionRule.js';

// Re-export types for convenience
export type { User, UserPreferences, AiInterventionRule };

export async function initializeDatabase() {
  try {
    // Initialize TypeORM connection
    const dataSourceInstance = await dataSource;
    
    if (!dataSourceInstance.isInitialized) {
      await dataSourceInstance.initialize();
      
      // Run migrations if needed
      if (process.env.NODE_ENV !== 'production') {
        console.log('Running migrations...');
        await dataSourceInstance.runMigrations();
        console.log('Migrations completed successfully');
      }
    }

    // Create default user if it doesn't exist
    const userRepository = dataSourceInstance.getRepository(User);
    const defaultUser = await userRepository.findOne({
      where: { email: 'default.user@example.com' }
    });

    if (!defaultUser) {
      const newUser = userRepository.create({
        email: 'default.user@example.com',
        name: 'Default User'
      });
      await userRepository.save(newUser);
      console.log('Default user created');
    }

    console.log('Database initialized successfully');
    return dataSourceInstance;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}