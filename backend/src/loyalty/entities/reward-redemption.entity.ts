import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum RedemptionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('reward_redemptions')
@Index(['accountId'])
@Index(['code'], { unique: true })
export class RewardRedemption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  accountId: string;

  @Column({ type: 'uuid' })
  rewardId: string;

  @Column({ type: 'int' })
  pointsUsed: number;

  @Column({
    type: 'enum',
    enum: RedemptionStatus,
    default: RedemptionStatus.PENDING,
  })
  status: RedemptionStatus;

  @Column({ type: 'varchar', length: 32, unique: true })
  code: string;

  @Column({ type: 'timestamp', nullable: true })
  usedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  orderId: string;

  @CreateDateColumn()
  createdAt: Date;
}
