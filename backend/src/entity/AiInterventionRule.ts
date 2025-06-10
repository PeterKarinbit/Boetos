import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('ai_intervention_rule')
export class AiInterventionRule {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'rule_name' })
  ruleName!: string;

  @Column({ name: 'trigger_type' })
  triggerType!: 'TIME_BASED' | 'ACTIVITY_BASED' | 'EXTERNAL_EVENT' | 'BEHAVIOR_PATTERN';

  @Column({ type: 'jsonb', name: 'trigger_condition' })
  triggerCondition!: Record<string, any>;

  @Column({ name: 'intervention_message_template' })
  interventionMessageTemplate!: string;

  @Column({ nullable: true, name: 'intervention_method' })
  interventionMethod?: 'BROWSER_NOTIFICATION' | 'DESKTOP_ALERT' | 'AUDIO_REMINDER' | 'SCREEN_OVERLAY' | 'IN_APP_MESSAGE' | 'NONE';

  @Column({ default: true, name: 'is_active' })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
} 