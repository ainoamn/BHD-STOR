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
import { ShippingZone } from './shipping-zone.entity';
import { ShippingCarrier } from './shipping-carrier.entity';

export enum ShippingConditionType {
  WEIGHT = 'weight',
  PRICE = 'price',
  QUANTITY = 'quantity',
  FLAT = 'flat',
}

@Entity('shipping_rates')
@Index(['zoneId'])
@Index(['carrierId'])
@Index(['isActive'])
export class ShippingRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'zone_id' })
  zoneId: string;

  @Column({ type: 'uuid', nullable: true, name: 'carrier_id' })
  carrierId: string | null;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({
    type: 'enum',
    enum: ShippingConditionType,
    default: ShippingConditionType.FLAT,
    name: 'condition_type',
  })
  conditionType: ShippingConditionType;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true, name: 'condition_min' })
  conditionMin: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true, name: 'condition_max' })
  conditionMax: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  price: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  // Relations
  @ManyToOne(() => ShippingZone, (zone) => zone.rates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'zone_id' })
  zone: Relation<ShippingZone>;

  @ManyToOne(() => ShippingCarrier, (carrier) => carrier.shippingRates, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'carrier_id' })
  carrier: Relation<ShippingCarrier> | null;

  // Timestamps
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Helper methods
  matchesCondition(value: number): boolean {
    if (this.conditionType === ShippingConditionType.FLAT) return true;

    const min = this.conditionMin ?? 0;
    const max = this.conditionMax ?? Infinity;

    return value >= min && value <= max;
  }

  matchesWeight(weight: number): boolean {
    return this.conditionType === ShippingConditionType.WEIGHT && this.matchesCondition(weight);
  }

  matchesPrice(price: number): boolean {
    return this.conditionType === ShippingConditionType.PRICE && this.matchesCondition(price);
  }

  matchesQuantity(quantity: number): boolean {
    return this.conditionType === ShippingConditionType.QUANTITY && this.matchesCondition(quantity);
  }
}
