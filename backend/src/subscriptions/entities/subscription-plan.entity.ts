import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PlanTier {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

@Entity('subscription_plans')
@Index(['tier'])
export class SubscriptionPlanEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'name_ar', type: 'varchar', length: 100, nullable: true })
  nameAr: string | null;

  @Column({
    type: 'enum',
    enum: PlanTier,
  })
  tier: PlanTier;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'description_ar', type: 'text', nullable: true })
  descriptionAr: string | null;

  @Column({ name: 'price_monthly', type: 'decimal', precision: 12, scale: 3 })
  priceMonthly: number;

  @Column({ name: 'price_yearly', type: 'decimal', precision: 12, scale: 3 })
  priceYearly: number;

  @Column({ name: 'currency_code', type: 'varchar', length: 3, default: 'OMR' })
  currencyCode: string;

  @Column({ name: 'product_limit', type: 'int', default: 0 })
  productLimit: number;

  @Column({ name: 'storage_limit_mb', type: 'int', default: 0 })
  storageLimitMb: number;

  @Column({
    name: 'transaction_fee_percent',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  transactionFeePercent: number;

  @Column({ type: 'jsonb', nullable: true })
  features: Array<Record<string, unknown>> | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
