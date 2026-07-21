import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VehicleType } from './vehicle.entity';

@Entity('pricing_rules')
export class PricingRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'uuid' })
  fromZoneId: string;

  @Column({ type: 'uuid' })
  toZoneId: string;

  @Column({
    type: 'enum',
    enum: VehicleType,
    default: VehicleType.CAR,
  })
  vehicleType: VehicleType;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  basePrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  weightRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  volumeRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  distanceRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.5 })
  expressMultiplier: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 2.0 })
  sameDayMultiplier: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  fuelSurcharge: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  minPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  maxPrice: number | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'date' })
  effectiveFrom: Date;

  @Column({ type: 'date', nullable: true })
  effectiveTo: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
