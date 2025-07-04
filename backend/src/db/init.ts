import 'dotenv/config';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { UserPreferences } from '../entities/UserPreferences';
import { AiInterventionRule } from '../entities/AiInterventionRule';
import ChatMessage from '../entities/ChatMessage';

// Re-export types for convenience
export type { User, UserPreferences, AiInterventionRule };

export async function initializeDatabase() {
  try {
    // Initialize TypeORM connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      
      // Run migrations if needed
      if (process.env.NODE_ENV !== 'production') {
        console.log('Running migrations...');
        await AppDataSource.runMigrations();
        console.log('Migrations completed successfully');
      }
    }

    // Create default user if it doesn't exist
    const userRepository = AppDataSource.getRepository(User);
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
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
} 