import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserPreferences } from './UserPreferences';
import { UserVoiceSettings } from './UserVoiceSettings';
import { Activity } from './Activity';
import { Meeting } from './Meeting';
import { AiInterventionRule } from './AiInterventionRule';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ nullable: true })
  google_id?: string;

  @Column({ nullable: true })
  google_access_token?: string;

  @Column({ nullable: true })
  google_refresh_token?: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  role?: string;

  @Column({ nullable: true })
  company?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ nullable: true, name: 'profile_image' })
  profileImage?: string;

  @Column({ type: 'jsonb', nullable: true })
  preferences?: any;

  @Column({ default: false })
  onboarding_completed!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  onboarding_data?: any;

  @Column({ default: false })
  email_verified!: boolean;

  @Column({ nullable: true })
  email_verification_token?: string;

  @Column({ type: 'timestamp', nullable: true })
  email_verification_expires?: Date;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @Column({ type: 'uuid', nullable: true })
  voice_settings_id?: string;

  @OneToOne(() => UserPreferences, preferences => preferences.user)
  preferencesRelation?: UserPreferences;

  @OneToOne(() => UserVoiceSettings, voiceSettings => voiceSettings.user)
  voiceSettings?: UserVoiceSettings;

  @OneToMany(() => Activity, activity => activity.user)
  activities?: Activity[];

  @OneToMany(() => Meeting, meeting => meeting.user)
  meetings?: Meeting[];

  @OneToMany(() => AiInterventionRule, rule => rule.user)
  aiInterventionRules?: AiInterventionRule[];
} 