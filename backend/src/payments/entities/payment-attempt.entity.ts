import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../database/entities/user.entity';

export enum PaymentAttemptStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  REQUIRES_ACTION = 'requires_action',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('payment_attempts')
@Index(['orderId'])
@Index(['userId'])
@Index(['status'])
@Index(['gateway'])
@Index(['gatewayReference'])
@Index(['createdAt'])
@Index(['userId', 'idempotencyKey'], { unique: true })
export class PaymentAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'order_id' })
  orderId: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 128, name: 'idempotency_key' })
  idempotencyKey: string;

  @Column({ type: 'varchar', length: 50 })
  gateway: string;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'OMR' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentAttemptStatus,
    default: PaymentAttemptStatus.PENDING,
  })
  status: PaymentAttemptStatus;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'gateway_reference' })
  gatewayReference: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true, name: 'request_hash' })
  requestHash: string | null;

  @Column({ type: 'jsonb', nullable: true, name: 'result_payload' })
  resultPayload: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true, name: 'last_error' })
  lastError: string | null;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Relation<Order>;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
