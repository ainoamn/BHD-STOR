import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Relation,
} from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Store } from '../../stores/entities/store.entity';

export enum SubscriptionPlan {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  TRIAL = 'trial',
  PAST_DUE = 'past_due',
}

@Entity('subscriptions')
@Index(['userId'])
@Index(['storeId'])
@Index(['status'])
@Index(['plan'])
@Index(['endsAt'])
@Index(['userId', 'status'])
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', nullable: true, name: 'store_id' })
  storeId: string | null;

  @Column({
    type: 'enum',
    enum: SubscriptionPlan,
  })
  plan: SubscriptionPlan;

  @Column({ type: 'varchar', length: 200, name: 'plan_name_ar' })
  planNameAr: string;

  @Column({ type: 'varchar', length: 200, name: 'plan_name_en' })
  planNameEn: string;

  @Column({
    type: 'enum',
    enum: BillingCycle,
    default: BillingCycle.MONTHLY,
    name: 'billing_cycle',
  })
  billingCycle: BillingCycle;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  price: number;

  @Column({ type: 'varchar', length: 3, default: 'OMR' })
  currency: string;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.TRIAL,
  })
  status: SubscriptionStatus;

  @Column({ type: 'jsonb', default: {} })
  features: Record<string, boolean>;

  @Column({ type: 'int', nullable: true, name: 'product_limit' })
  productLimit: number | null;

  @Column({ type: 'int', nullable: true, name: 'storage_limit' })
  storageLimit: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'commission_rate' })
  commissionRate: number | null;

  @Column({ type: 'timestamptz', name: 'starts_at' })
  startsAt: Date;

  @Column({ type: 'timestamptz', name: 'ends_at' })
  endsAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'cancelled_at' })
  cancelledAt: Date | null;

  @Column({ type: 'text', nullable: true, name: 'cancel_reason' })
  cancelReason: string | null;

  @Column({ type: 'boolean', default: true, name: 'auto_renew' })
  autoRenew: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'payment_method' })
  paymentMethod: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  // Relations
  @ManyToOne(() => User, (user) => user.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @ManyToOne(() => Store, (store) => store.subscriptions, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'store_id' })
  store: Relation<Store> | null;

  // Timestamps
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Helper methods
  isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE || this.status === SubscriptionStatus.TRIAL;
  }

  isExpired(): boolean {
    return new Date() > this.endsAt;
  }

  isCancelled(): boolean {
    return this.status === SubscriptionStatus.CANCELLED || this.cancelledAt !== null;
  }

  daysUntilExpiry(): number {
    const now = new Date();
    const endsAt = new Date(this.endsAt);
    const diffMs = endsAt.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  hasFeature(feature: string): boolean {
    return this.features[feature] === true;
  }

  getProductLimit(): number {
    return this.productLimit ?? 0;
  }

  hasUnlimitedProducts(): boolean {
    return this.productLimit === 0;
  }
}
