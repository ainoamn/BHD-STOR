import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Relation,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Store } from '../../stores/entities/store.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  RETURNED = 'returned',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum FulfillmentStatus {
  UNFULFILLED = 'unfulfilled',
  PARTIAL = 'partial',
  FULFILLED = 'fulfilled',
}

export enum OrderSource {
  WEB = 'web',
  MOBILE = 'mobile',
  ADMIN = 'admin',
}

export interface OrderAddress {
  fullName: string;
  phone: string;
  city: string;
  street: string;
  country?: string;
  governorate?: string;
  building?: string;
  postalCode?: string;
}

@Entity('orders')
@Index(['userId'])
@Index(['orderNumber'], { unique: true })
@Index(['status'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_number', type: 'varchar', length: 50, unique: true })
  orderNumber: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Column({ name: 'store_id', type: 'uuid', nullable: true })
  storeId: string | null;

  @ManyToOne(() => Store, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'store_id' })
  store: Relation<Store> | null;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ type: 'decimal', precision: 15, scale: 3 })
  subtotal: number;

  @Column({ name: 'tax_amount', type: 'decimal', precision: 15, scale: 3, default: 0 })
  tax: number;

  @Column({ name: 'shipping_amount', type: 'decimal', precision: 15, scale: 3, default: 0 })
  shipping: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 15, scale: 3, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 15, scale: 3 })
  total: number;

  @Column({ name: 'currency_code', type: 'varchar', length: 3, default: 'OMR' })
  currency: string;

  @Column({
    name: 'payment_status',
    type: 'varchar',
    length: 50,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: string;

  @Column({ name: 'payment_method', type: 'varchar', length: 50, nullable: true })
  paymentMethod: string | null;

  @Column({ name: 'shipping_address', type: 'jsonb' })
  shippingAddress: OrderAddress;

  @Column({ name: 'billing_address', type: 'jsonb', nullable: true })
  billingAddress: OrderAddress | null;

  @Column({ name: 'coupon_code', type: 'varchar', length: 50, nullable: true })
  couponCode: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'tracking_number', type: 'varchar', length: 100, nullable: true })
  trackingNumber: string | null;

  @Column({ name: 'status_history', type: 'jsonb', nullable: true })
  statusHistory: Array<{ status: string; note?: string; timestamp: string }> | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: Relation<OrderItem[]>;

  // Optional inverse relation used by Review entity
  reviews?: any[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
