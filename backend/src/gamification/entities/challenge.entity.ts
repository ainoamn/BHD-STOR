import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum ChallengeType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  SPECIAL = 'special',
}

@Entity('challenges')
export class Challenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 200, name: 'name_ar' })
  nameAr: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ChallengeType,
    default: ChallengeType.DAILY,
  })
  type: ChallengeType;

  @Column({ type: 'jsonb', default: {} })
  condition: Record<string, unknown>;

  @Column({ type: 'int', name: 'reward_points', default: 0 })
  rewardPoints: number;

  @Column({ type: 'uuid', name: 'reward_badge_id', nullable: true })
  rewardBadgeId: string | null;

  @Column({ type: 'timestamp', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'timestamp', name: 'end_date' })
  endDate: Date;

  @Column({ type: 'int', name: 'max_participants', nullable: true })
  maxParticipants: number | null;

  @Column({ type: 'int', default: 0 })
  participants: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
