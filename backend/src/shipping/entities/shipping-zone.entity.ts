import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Relation,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { ShippingRate } from './shipping-rate.entity';

@Entity('shipping_zones')
@Index(['storeId'])
@Index(['isActive'])
export class ShippingZone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true, name: 'store_id' })
  storeId: string | null;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 2, array: true, default: ['OM'] })
  countries: string[];

  @Column({ type: 'varchar', length: 100, array: true, nullable: true })
  regions: string[] | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  // Relations
  @ManyToOne(() => Store, (store) => store.shippingZones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Relation<Store> | null;

  @OneToMany(() => ShippingRate, (rate) => rate.zone, { cascade: true, orphanRemoval: true })
  rates: Relation<ShippingRate[]>;

  // Timestamps
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Helper methods
  includesCountry(countryCode: string): boolean {
    return this.countries.includes(countryCode.toUpperCase());
  }

  includesRegion(region: string): boolean {
    return this.regions?.includes(region) ?? false;
  }
}
