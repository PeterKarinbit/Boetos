import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User.js';

@Entity('ai_intervention_rule')
export class AiInterventionRule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true, name: 'rule_name' })
  ruleName?: string;

  @Column({ name: 'rule_type' })
  ruleType!: string;

  @Column({ type: 'jsonb', name: 'rule_condition' })
  ruleCondition!: any;

  @Column({ nullable: true, name: 'intervention_method' })
  interventionMethod?: string;

  @Column({ type: 'text', nullable: true, name: 'intervention_message_template' })
  interventionMessageTemplate?: string;

  @Column({ default: true, name: 'is_active' })
  isActive!: boolean;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => User, user => user.aiInterventionRules, { onDelete: 'CASCADE' })
  user?: User;

  setUser(user: User): void {
    this.user = user;
  }
}