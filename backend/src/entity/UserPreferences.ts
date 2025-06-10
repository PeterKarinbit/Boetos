import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('user_preferences')
export class UserPreferences {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'preferred_channel' })
  preferredChannel!: 'SMS' | 'VOICE' | 'IN_APP';

  @Column({ nullable: true, name: 'quiet_hours_start' })
  quietHoursStart?: string;

  @Column({ nullable: true, name: 'quiet_hours_end' })
  quietHoursEnd?: string;

  @Column({ nullable: true, name: 'reminder_frequency' })
  reminderFrequency?: number;

  @Column({ name: 'tone_preference' })
  tonePreference!: 'FRIENDLY' | 'PROFESSIONAL' | 'CASUAL';

  @Column({ type: 'text', array: true, name: 'auto_track_categories' })
  autoTrackCategories!: string[];

  @Column({ name: 'enable_ai_interventions' })
  enableAiInterventions!: boolean;

  @Column({ nullable: true, name: 'preferred_intervention_method' })
  preferredInterventionMethod?: 'BROWSER_NOTIFICATION' | 'DESKTOP_ALERT' | 'AUDIO_REMINDER' | 'SCREEN_OVERLAY' | 'IN_APP_MESSAGE';

  @Column({ type: 'jsonb', nullable: true, name: 'ai_tone_preference' })
  aiTonePreference?: 'FRIENDLY' | 'PROFESSIONAL' | 'CASUAL' | 'DIRECTIVE' | 'EMPATHETIC';

  @Column({ type: 'jsonb', nullable: true, name: 'custom_intervention_messages' })
  customInterventionMessages?: Record<string, string>;

  @Column({ type: 'jsonb', nullable: true, name: 'ai_onboarding_memory' })
  aiOnboardingMemory?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
} 