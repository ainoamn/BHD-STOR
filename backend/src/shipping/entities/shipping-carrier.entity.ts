import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
  Relation,
} from 'typeorm';
import { Shipment } from './shipment.entity';
import { ShippingRate } from './shipping-rate.entity';

@Entity('shipping_carriers')
@Index(['code'])
@Index(['isActive'])
export class ShippingCarrier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true, name: 'api_config' })
  apiConfig: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 2, array: true, default: ['OM'], name: 'supported_countries' })
  supportedCountries: string[];

  @Column({ type: 'jsonb', default: [], name: 'supported_methods' })
  supportedMethods: { name: string; code: string; estimatedDays: number }[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo: string | null;

  @Column({ type: 'int', default: 0, name: 'display_order' })
  displayOrder: number;

  // Relations
  @OneToMany(() => Shipment, (shipment) => shipment.carrier)
  shipments: Relation<Shipment[]>;

  @OneToMany(() => ShippingRate, (rate) => rate.carrier)
  shippingRates: Relation<ShippingRate[]>;

  // Timestamps
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Helper methods
  supportsCountry(countryCode: string): boolean {
    return this.supportedCountries.includes(countryCode.toUpperCase());
  }
}
