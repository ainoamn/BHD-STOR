import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
  Relation,
} from 'typeorm';
import { Address } from './address.entity';
import { RefreshToken } from './refresh-token.entity';
import { Store } from '../../stores/entities/store.entity';
import { Order } from '../../orders/entities/order.entity';
import { Review } from '../../products/entities/review.entity';
import { CartItem } from '../../orders/entities/cart-item.entity';
import { Wishlist } from '../../orders/entities/wishlist.entity';
import { Notification } from './notification.entity';
import { ActivityLog } from './activity-log.entity';
import { ChatMessage } from '../../chat/entities/chat-message.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { Payment } from '../../payments/entities/payment.entity';

export enum UserRole {
  CUSTOMER = 'customer',
  SELLER = 'seller',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

export enum CommissionType {
  SUBSCRIPTION = 'subscription',
  PERCENTAGE = 'percentage',
  HYBRID = 'hybrid',
}

export enum SubscriptionPlan {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

export enum Language {
  AR = 'ar',
  EN = 'en',
}

@Entity('users')
@Index(['email'])
@Index(['role'])
@Index(['status'])
@Index(['role', 'status'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  email: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password: string;

  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  firstName: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name' })
  lastName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION,
  })
  status: UserStatus;

  @Column({ type: 'boolean', default: false, name: 'email_verified' })
  emailVerified: boolean;

  @Column({ type: 'boolean', default: false, name: 'phone_verified' })
  phoneVerified: boolean;

  @Column({ type: 'boolean', default: false, name: 'two_factor_enabled' })
  twoFactorEnabled: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'two_factor_secret' })
  twoFactorSecret: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_login_at' })
  lastLoginAt: Date | null;

  @Column({ type: 'int', default: 0, name: 'login_attempts' })
  loginAttempts: number;

  @Column({ type: 'timestamptz', nullable: true, name: 'lock_until' })
  lockUntil: Date | null;

  @Column({
    type: 'enum',
    enum: Language,
    default: Language.AR,
    name: 'preferred_language',
  })
  preferredLanguage: Language;

  @Column({ type: 'varchar', length: 3, default: 'OMR', name: 'preferred_currency' })
  preferredCurrency: string;

  @Column({
    type: 'enum',
    enum: CommissionType,
    default: CommissionType.PERCENTAGE,
    name: 'commission_type',
  })
  commissionType: CommissionType;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 5.0, name: 'commission_rate' })
  commissionRate: number;

  @Column({
    type: 'enum',
    enum: SubscriptionPlan,
    default: SubscriptionPlan.FREE,
    name: 'subscription_plan',
  })
  subscriptionPlan: SubscriptionPlan;

  @Column({ type: 'timestamptz', nullable: true, name: 'subscription_expires_at' })
  subscriptionExpiresAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  // Relations
  @OneToMany(() => Address, (address) => address.user, { cascade: true })
  addresses: Relation<Address[]>;

  @OneToMany(() => Store, (store) => store.owner)
  stores: Relation<Store[]>;

  @OneToMany(() => Order, (order) => order.user)
  orders: Relation<Order[]>;

  @OneToMany(() => Review, (review) => review.user)
  reviews: Relation<Review[]>;

  @OneToMany(() => CartItem, (cartItem) => cartItem.user)
  cartItems: Relation<CartItem[]>;

  @OneToMany(() => Wishlist, (wishlist) => wishlist.user)
  wishlist: Relation<Wishlist[]>;

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user, { cascade: true })
  refreshTokens: Relation<RefreshToken[]>;

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Relation<Notification[]>;

  @OneToMany(() => ActivityLog, (activityLog) => activityLog.user)
  activityLogs: Relation<ActivityLog[]>;

  @OneToMany(() => ChatMessage, (chatMessage) => chatMessage.sender)
  sentMessages: Relation<ChatMessage[]>;

  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscriptions: Relation<Subscription[]>;

  @OneToMany(() => Payment, (payment) => payment.user)
  payments: Relation<Payment[]>;

  // Timestamps
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true, name: 'deleted_at' })
  deletedAt: Date | null;

  // Helper getter for full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Helper method to check if account is locked
  isLocked(): boolean {
    return !!(this.lockUntil && this.lockUntil > new Date());
  }
}
