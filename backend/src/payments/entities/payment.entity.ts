import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
  Relation,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../database/entities/user.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  COD = 'cod',
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  OMAN_NET = 'oman_net',
  THAWANI = 'thawani',
  TELR = 'telr',
  CCAVENUE = 'ccavenue',
  WALLET = 'wallet',
  INSTALLMENT = 'installment',
}

@Entity('payments')
@Index(['orderId'])
@Index(['userId'])
@Index(['status'])
@Index(['method'])
@Index(['gatewayTransactionId'])
@Index(['createdAt'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'order_id' })
  orderId: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'OMR' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  method: PaymentMethod;

  @Column({ type: 'varchar', length: 100, nullable: true })
  gateway: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'gateway_transaction_id' })
  @Index()
  gatewayTransactionId: string | null;

  @Column({ type: 'jsonb', nullable: true, name: 'gateway_response' })
  gatewayResponse: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 4, nullable: true, name: 'card_last_four' })
  cardLastFour: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'card_brand' })
  cardBrand: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'paid_at' })
  paidAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'refunded_at' })
  refundedAt: Date | null;

  @Column({ type: 'decimal', precision: 12, scale: 3, nullable: true, name: 'refund_amount' })
  refundAmount: number | null;

  @Column({ type: 'text', nullable: true, name: 'refund_reason' })
  refundReason: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  // Relations
  @OneToOne(() => Order, (order) => order.payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Relation<Order>;

  @ManyToOne(() => User, (user) => user.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  // Timestamps
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Helper methods
  isCompleted(): boolean {
    return this.status === PaymentStatus.COMPLETED;
  }

  isRefunded(): boolean {
    return this.status === PaymentStatus.REFUNDED;
  }

  getRefundableAmount(): number {
    if (!this.isCompleted()) return 0;
    const alreadyRefunded = this.refundAmount ?? 0;
    return Math.max(0, this.amount - alreadyRefunded);
  }

  canRefund(): boolean {
    return this.isCompleted() && this.getRefundableAmount() > 0;
  }
}
