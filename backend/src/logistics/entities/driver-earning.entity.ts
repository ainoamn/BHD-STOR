import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EarningType {
  DELIVERY_FEE = 'delivery_fee',
  BONUS = 'bonus',
  PENALTY = 'penalty',
  FUEL_ALLOWANCE = 'fuel_allowance',
}

export enum EarningStatus {
  PENDING = 'pending',
  PAID = 'paid',
  DISPUTED = 'disputed',
}

@Entity('driver_earnings')
export class DriverEarning {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  driverId: string;

  @Column({ type: 'uuid' })
  shipmentId: string;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  amount: number;

  @Column({
    type: 'enum',
    enum: EarningType,
    default: EarningType.DELIVERY_FEE,
  })
  type: EarningType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: EarningStatus,
    default: EarningStatus.PENDING,
  })
  status: EarningStatus;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
