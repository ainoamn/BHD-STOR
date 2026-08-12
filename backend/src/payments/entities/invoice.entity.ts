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
import { Payment } from './payment.entity';

export enum InvoiceStatus {
  ISSUED = 'issued',
  VOID = 'void',
}

@Entity('invoices')
@Index(['invoiceNumber'], { unique: true })
@Index(['paymentId'], { unique: true })
@Index(['orderId'])
@Index(['userId'])
@Index(['year', 'sequence'], { unique: true })
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Human-facing number, e.g. INV-2026-000042 */
  @Column({ type: 'varchar', length: 32, name: 'invoice_number' })
  invoiceNumber: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int' })
  sequence: number;

  @Column({ type: 'uuid', name: 'payment_id' })
  paymentId: string;

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
    enum: InvoiceStatus,
    default: InvoiceStatus.ISSUED,
  })
  status: InvoiceStatus;

  @Column({ type: 'varchar', length: 64, nullable: true })
  gateway: string | null;

  @Column({ type: 'timestamptz', name: 'issued_at' })
  issuedAt: Date;

  @ManyToOne(() => Payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_id' })
  payment: Relation<Payment>;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Relation<Order>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
