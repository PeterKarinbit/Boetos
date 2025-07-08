import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './User.js';

@Entity('activity')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar' })
  type!: string;

  @Column({ type: 'varchar', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => User, user => user.activities)
  user!: User;

  setUser(user: User): void {
    this.user = user;
  }
}