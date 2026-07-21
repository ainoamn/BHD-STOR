import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CommissionPlan } from './commission-plan.entity';

export enum CommissionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

@Entity('commissions')
export class Commission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  planId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'uuid', nullable: true })
  productId: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  saleAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  commissionAmount: number;

  @Column({
    type: 'enum',
    enum: CommissionStatus,
    default: CommissionStatus.PENDING,
  })
  status: CommissionStatus;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  paidBy: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentReference: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => CommissionPlan, (plan) => plan.commissions)
  @JoinColumn({ name: 'planId' })
  plan: CommissionPlan;
}
