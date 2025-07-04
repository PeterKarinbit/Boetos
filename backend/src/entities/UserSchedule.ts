import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../entities/User';

@Entity('user_schedule')
export class UserSchedule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ nullable: true, name: 'event_id' })
  eventId?: string;

  @Column({ nullable: true })
  title?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'timestamp', nullable: true, name: 'start_time' })
  startTime?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'end_time' })
  endTime?: Date;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true, name: 'event_type' })
  eventType?: string;

  @Column({ nullable: true })
  source?: string;

  @Column({ default: false, name: 'is_all_day' })
  isAllDay!: boolean;

  @Column({ nullable: true })
  status?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => User, user => user.activities)
  user?: User;

  setUser(user: any) {
    // ... existing code ...
  }
} 