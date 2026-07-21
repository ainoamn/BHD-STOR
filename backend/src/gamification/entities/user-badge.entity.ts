import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Badge } from './badge.entity';

@Entity('user_badges')
export class UserBadge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'badge_id' })
  badgeId: string;

  @Column({ type: 'boolean', default: true })
  equipped: boolean;

  @CreateDateColumn({ name: 'earned_at' })
  earnedAt: Date;

  @ManyToOne(() => Badge, (badge) => badge.userBadges, {
    eager: true,
  })
  @JoinColumn({ name: 'badge_id' })
  badge: Badge;
}
