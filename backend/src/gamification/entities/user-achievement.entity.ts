import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Achievement } from './achievement.entity';

@Entity('user_achievements')
export class UserAchievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'achievement_id' })
  achievementId: string;

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({ type: 'int', default: 1 })
  target: number;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @Column({ type: 'timestamp', name: 'completed_at', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Achievement, (achievement) => achievement.userAchievements, {
    eager: true,
  })
  @JoinColumn({ name: 'achievement_id' })
  achievement: Achievement;
}
