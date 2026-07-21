import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Commission } from './commission.entity';

export enum CommissionType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
  TIERED = 'tiered',
  MLM = 'mlm',
}

export enum ApplicableTo {
  ALL_PRODUCTS = 'all_products',
  CATEGORIES = 'categories',
  SPECIFIC_PRODUCTS = 'specific_products',
}

export interface CommissionTier {
  minAmount: number;
  maxAmount?: number;
  rate: number;
}

export interface MLMLevel {
  level: number;
  rate: number;
  description?: string;
}

@Entity('commission_plans')
export class CommissionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: CommissionType,
  })
  type: CommissionType;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  rate: number | null; // For percentage type (e.g., 0.10 = 10%)

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  amount: number | null; // For fixed type

  @Column({ type: 'jsonb', nullable: true })
  tiers: CommissionTier[] | null; // For tiered type [{minAmount, maxAmount, rate}]

  @Column({ type: 'jsonb', nullable: true })
  levels: MLMLevel[] | null; // For MLM type [{level, rate, description}]

  @Column({
    type: 'enum',
    enum: ApplicableTo,
    default: ApplicableTo.ALL_PRODUCTS,
  })
  applicableTo: ApplicableTo;

  @Column({ type: 'simple-array', default: '' })
  productIds: string[];

  @Column({ type: 'simple-array', default: '' })
  categoryIds: string[];

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Commission, (commission) => commission.plan)
  commissions: Commission[];
}
