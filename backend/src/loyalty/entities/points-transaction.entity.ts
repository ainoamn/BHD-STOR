import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum PointsTransactionType {
  EARN = 'earn',
  REDEEM = 'redeem',
  EXPIRE = 'expire',
  BONUS = 'bonus',
  ADJUSTMENT = 'adjustment',
  REFERRAL = 'referral',
}

@Entity('points_transactions')
@Index(['accountId'])
@Index(['orderId'])
@Index(['createdAt'])
export class PointsTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  accountId: string;

  @Column({
    type: 'enum',
    enum: PointsTransactionType,
  })
  type: PointsTransactionType;

  @Column({ type: 'int' })
  points: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  orderId: string;

  @Column({ type: 'timestamp', nullable: true })
  expiryDate: Date;

  @CreateDateColumn()
  createdAt: Date;
}
