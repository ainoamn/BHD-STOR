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

/**
 * Aligned with migration 001 `shipping_carriers` + display_order (012).
 */
@Entity('shipping_carriers')
@Index(['code'])
@Index(['isActive'])
export class ShippingCarrier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'name_ar' })
  nameAr: string | null;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'api_endpoint' })
  apiEndpoint: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'api_key' })
  apiKey: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'api_secret' })
  apiSecret: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    name: 'tracking_url_template',
  })
  trackingUrlTemplate: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'boolean', default: false, name: 'supports_cod' })
  supportsCod: boolean;

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, unknown> | null;

  @Column({ type: 'int', default: 0, name: 'display_order' })
  displayOrder: number;

  @OneToMany(() => Shipment, (shipment) => shipment.carrier)
  shipments: Relation<Shipment[]>;

  @OneToMany(() => ShippingRate, (rate) => rate.carrier)
  shippingRates: Relation<ShippingRate[]>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
