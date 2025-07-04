import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { User } from '../entities/User';

@Entity('user_voice_settings') // Using lowercase snake_case for table name
export class UserVoiceSettings {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', nullable: false })
    user_id!: string;

    @Column({ nullable: true })
    voice_model!: string;

    @Column({ nullable: true })
    voice_id!: string;

    @Column({ default: false })
    voice_enabled!: boolean;

    @Column({ nullable: true })
    voice_language!: string;

    @Column({ type: 'float', default: 1.0 })
    voice_speed!: number;

    @Column({ type: 'float', default: 1.0 })
    voice_pitch!: number;

    @Column({ type: 'float', default: 1.0 })
    voice_volume!: number;

    // ... add other voice settings columns as needed ...

    @Column({ nullable: true })
    voice_gender!: string;

    @Column({ nullable: true })
    voice_accent!: string;

    @Column({ nullable: true })
    voice_style!: string;

    @Column({ nullable: true })
    voice_emotion!: string;

    @Column({ nullable: true })
    voice_background!: string;


    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;

    @OneToOne(() => User, user => user.voiceSettings)
    @JoinColumn({ name: 'user_id' })
    user?: User;

    setUser(user: User) {
        // ... existing code ...
    }
}