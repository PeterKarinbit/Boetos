import 'dotenv/config';
import { AppDataSource } from '../data-source';
import { User } from '../entity/User';
import { UserPreferences } from '../entity/UserPreferences';
import { AiInterventionRule } from '../entity/AiInterventionRule';
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
        id: '2e5f217f-c892-469c-910b-20ed6c87ef5c',
        email: 'default.user@example.com',
        name: 'Default User',
        createdAt: new Date()
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