import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface LoyaltyTier {
  name: string;
  nameAr?: string;
  minPoints: number;
  multiplier: number; // Point earning multiplier
  benefits: string[];
  color?: string;
  icon?: string;
}

@Entity('loyalty_programs')
export class LoyaltyProgram {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1.0 })
  pointsPerCurrency: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0.01 })
  currencyPerPoint: number;

  @Column({ type: 'int', default: 100 })
  welcomeBonus: number;

  @Column({ type: 'int', default: 50 })
  referralBonus: number;

  @Column({ type: 'jsonb', default: '[]' })
  tiers: LoyaltyTier[];

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
