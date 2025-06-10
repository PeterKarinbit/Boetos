import 'dotenv/config';
import { AppDataSource } from '../data-source';
import { User } from '../entity/User';
import { UserPreferences } from '../entity/UserPreferences';
import { AiInterventionRule } from '../entity/AiInterventionRule';

// Export interfaces for type checking
export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  profileImage?: string;
  avatar?: string;
  preferences?: any;
  createdAt: Date;
  googleId?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
}

export interface UserPreferences {
  id: number;
  userId: string;
  preferredChannel: 'SMS' | 'VOICE' | 'IN_APP';
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  reminderFrequency: number;
  tonePreference: 'FRIENDLY' | 'PROFESSIONAL' | 'CASUAL';
  autoTrackCategories: string[];
  enableAiInterventions: boolean;
  preferredInterventionMethod: 'BROWSER_NOTIFICATION' | 'DESKTOP_ALERT' | 'AUDIO_REMINDER' | 'SCREEN_OVERLAY' | 'IN_APP_MESSAGE';
  aiTonePreference: 'FRIENDLY' | 'PROFESSIONAL' | 'CASUAL' | 'DIRECTIVE' | 'EMPATHETIC';
  customInterventionMessages: Record<string, string>;
  aiOnboardingMemory: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AiInterventionRule {
  id: number;
  userId: string;
  ruleName: string;
  triggerType: 'TIME_BASED' | 'ACTIVITY_BASED' | 'EXTERNAL_EVENT' | 'BEHAVIOR_PATTERN';
  triggerCondition: Record<string, any>;
  interventionMessageTemplate: string;
  interventionMethod: 'BROWSER_NOTIFICATION' | 'DESKTOP_ALERT' | 'AUDIO_REMINDER' | 'SCREEN_OVERLAY' | 'IN_APP_MESSAGE' | 'NONE' | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function initializeDatabase() {
  try {
    // Initialize TypeORM connection
    await AppDataSource.initialize();

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