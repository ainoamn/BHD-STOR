import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ReturnType {
  RETURN = 'return',
  EXCHANGE = 'exchange',
}

export enum ReturnReason {
  DEFECTIVE = 'defective',
  WRONG_ITEM = 'wrong_item',
  NOT_AS_DESCRIBED = 'not_as_described',
  CHANGED_MIND = 'changed_mind',
  DAMAGED = 'damaged',
  OTHER = 'other',
}

export enum ReturnStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PICKED_UP = 'picked_up',
  RECEIVED = 'received',
  REFUNDED = 'refunded',
  EXCHANGED = 'exchanged',
  CLOSED = 'closed',
}

export enum RefundMethod {
  ORIGINAL_PAYMENT = 'original_payment',
  WALLET = 'wallet',
  BANK_TRANSFER = 'bank_transfer',
}

export interface PickupAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  governorate: string;
  postalCode?: string;
  landmark?: string;
}

export interface TimelineEvent {
  status: ReturnStatus;
  note: string;
  timestamp: string;
  actor?: string;
}

@Entity('return_requests')
@Index(['userId'])
@Index(['orderId'])
@Index(['status'])
@Index(['productId'])
export class ReturnRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  productId: string;

  @Column({
    type: 'enum',
    enum: ReturnType,
    default: ReturnType.RETURN,
  })
  type: ReturnType;

  @Column({
    type: 'enum',
    enum: ReturnReason,
  })
  reason: ReturnReason;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ReturnStatus,
    default: ReturnStatus.PENDING,
  })
  status: ReturnStatus;

  @Column({ type: 'simple-array', nullable: true, default: '' })
  images: string[];

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  refundAmount: number;

  @Column({
    type: 'enum',
    enum: RefundMethod,
    nullable: true,
  })
  refundMethod: RefundMethod;

  @Column({ type: 'uuid', nullable: true })
  exchangeProductId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  exchangeVariant: string;

  @Column({ type: 'jsonb', nullable: true })
  pickupAddress: PickupAddress;

  @Column({ type: 'timestamp', nullable: true })
  pickupDate: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  trackingNumber: string;

  @Column({ type: 'text', nullable: true })
  adminNotes: string;

  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  timeline: TimelineEvent[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
