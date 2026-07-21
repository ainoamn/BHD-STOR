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
import { Store } from '../../stores/entities/store.entity';

export enum PayoutStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('payouts')
@Index(['storeId'])
@Index(['status'])
@Index(['reference'])
@Index(['createdAt'])
export class Payout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'store_id' })
  storeId: string;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'OMR' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PayoutStatus,
    default: PayoutStatus.PENDING,
  })
  status: PayoutStatus;

  @Column({ type: 'varchar', length: 100 })
  method: string;

  @Column({ type: 'varchar', length: 255, name: 'destination_account' })
  destinationAccount: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  reference: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'processed_at' })
  processedAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  // Relations
  @ManyToOne(() => Store, (store) => store.payouts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Relation<Store>;

  // Timestamps
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Helper methods
  isProcessed(): boolean {
    return this.status === PayoutStatus.COMPLETED || this.status === PayoutStatus.FAILED;
  }

  canProcess(): boolean {
    return this.status === PayoutStatus.PENDING;
  }
}
