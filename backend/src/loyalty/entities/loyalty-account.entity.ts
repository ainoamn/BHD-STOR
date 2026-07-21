import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('loyalty_accounts')
@Index(['userId'], { unique: true })
@Index(['referralCode'], { unique: true })
export class LoyaltyAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @Column({ type: 'int', default: 0 })
  totalPoints: number;

  @Column({ type: 'int', default: 0 })
  availablePoints: number;

  @Column({ type: 'int', default: 0 })
  lifetimePoints: number;

  @Column({ type: 'int', default: 0 })
  redeemedPoints: number;

  @Column({ type: 'varchar', length: 50, default: 'bronze' })
  currentTier: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  referralCode: string;

  @Column({ type: 'uuid', nullable: true })
  referredBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
