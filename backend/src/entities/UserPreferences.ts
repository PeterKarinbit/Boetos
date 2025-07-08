import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User.js';

@Entity('user_preferences')
export class UserPreferences {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', name: 'preferred_channel' })
  preferredChannel!: string;

  @Column({ type: 'varchar', nullable: true, name: 'quiet_hours_start' })
  quietHoursStart?: string;

  @Column({ type: 'varchar', nullable: true, name: 'quiet_hours_end' })
  quietHoursEnd?: string;

  @Column({ type: 'int', nullable: true, name: 'reminder_frequency' })
  reminderFrequency?: number;

  @Column({ type: 'varchar', name: 'tone_preference' })
  tonePreference!: string;

  @Column({ type: 'text', array: true, name: 'auto_track_categories' })
  autoTrackCategories!: string[];

  @Column({ type: 'boolean', name: 'enable_ai_interventions' })
  enableAiInterventions!: boolean;

  @Column({ type: 'varchar', nullable: true, name: 'preferred_intervention_method' })
  preferredInterventionMethod?: string;

  @Column({ type: 'jsonb', nullable: true, name: 'ai_tone_preference' })
  aiTonePreference?: any;

  @Column({ type: 'jsonb', nullable: true, name: 'custom_intervention_messages' })
  customInterventionMessages?: any;

  @Column({ type: 'jsonb', nullable: true, name: 'ai_onboarding_memory' })
  aiOnboardingMemory?: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToOne('User', 'preferencesRelation')
  @JoinColumn({ name: 'user_id' })
  user?: any;

  setUser(user: User): void {
    this.user = user;
  }
}