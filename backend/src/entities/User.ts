import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserPreferences } from './UserPreferences.js';
import { UserVoiceSettings } from './UserVoiceSettings.js';
import { Activity } from './Activity.js';
import { Meeting } from './Meeting.js';
import { AiInterventionRule } from './AiInterventionRule.js';

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

  @OneToOne('UserPreferences', 'user')
  preferencesRelation?: UserPreferences;

  @OneToOne('UserVoiceSettings', 'user')
  voiceSettings?: UserVoiceSettings;

  @OneToMany('Activity', 'user')
  activities?: Activity[];

  @OneToMany('Meeting', 'user')
  meetings?: Meeting[];

  @OneToMany('AiInterventionRule', 'user')
  aiInterventionRules?: AiInterventionRule[];

  setPreferences(preferences: UserPreferences): void {
    this.preferencesRelation = preferences;
  }

  setVoiceSettings(voiceSettings: UserVoiceSettings): void {
    this.voiceSettings = voiceSettings;
  }

  addActivity(activity: Activity): void {
    // Implementation of addActivity method
  }

  addMeeting(meeting: Meeting): void {
    if (!this.meetings) {
      this.meetings = [];
    }
    this.meetings.push(meeting);
  }

  addAiInterventionRule(rule: AiInterventionRule): void {
    if (!this.aiInterventionRules) {
      this.aiInterventionRules = [];
    }
    this.aiInterventionRules.push(rule);
  }

  setActivity(activity: Activity): void {
    if (!this.activities) {
      this.activities = [];
    }
    this.activities.push(activity);
  }

  setMeeting(meeting: Meeting): void {
    if (!this.meetings) {
      this.meetings = [];
    }
    this.meetings.push(meeting);
  }

  setRule(rule: AiInterventionRule): void {
    // Implementation of setRule method
  }
} 