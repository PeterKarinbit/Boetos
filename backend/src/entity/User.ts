import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  password?: string;

  @Column()
  name!: string;

  @Column({ nullable: true, name: 'profile_image' })
  profileImage?: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ type: 'jsonb', nullable: true })
  preferences?: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ nullable: true, name: 'google_id' })
  googleId?: string;

  @Column({ nullable: true, name: 'google_access_token' })
  googleAccessToken?: string;

  @Column({ nullable: true, name: 'google_refresh_token' })
  googleRefreshToken?: string;
} 