import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User.js';

@Entity('user_voice_settings')
export class UserVoiceSettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  user_id!: string;

  @Column({ type: 'varchar', nullable: true })
  voice_model?: string;

  @Column({ type: 'varchar', nullable: true })
  voice_id?: string;

  @Column({ type: 'boolean', default: false })
  voice_enabled!: boolean;

  @Column({ type: 'varchar', nullable: true })
  voice_language?: string;

  @Column({ type: 'float', default: 1.0 })
  voice_speed!: number;

  @Column({ type: 'float', default: 1.0 })
  voice_pitch!: number;

  @Column({ type: 'float', default: 1.0 })
  voice_volume!: number;

  @Column({ type: 'varchar', nullable: true })
  voice_gender?: string;

  @Column({ type: 'varchar', nullable: true })
  voice_accent?: string;

  @Column({ type: 'varchar', nullable: true })
  voice_style?: string;

  @Column({ type: 'varchar', nullable: true })
  voice_emotion?: string;

  @Column({ type: 'varchar', nullable: true })
  voice_background?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToOne('User', 'voiceSettings')
  @JoinColumn({ name: 'user_id' })
  user?: any;

  setUser(user: User): void {
    this.user = user;
  }
}