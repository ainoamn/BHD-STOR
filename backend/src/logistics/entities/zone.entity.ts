import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ZoneType {
  COUNTRY = 'country',
  REGION = 'region',
  CITY = 'city',
  DISTRICT = 'district',
}

export enum PricingTier {
  TIER1 = 'tier1',
  TIER2 = 'tier2',
  TIER3 = 'tier3',
  TIER4 = 'tier4',
}

@Entity('zones')
export class Zone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  nameEn: string;

  @Column({ type: 'uuid', nullable: true })
  parentId: string | null;

  @Column({ type: 'varchar', length: 20, unique: true })
  @Index()
  code: string;

  @Column({
    type: 'enum',
    enum: ZoneType,
    default: ZoneType.CITY,
  })
  type: ZoneType;

  @Column({ type: 'boolean', default: true })
  coverage: boolean;

  @Column({ type: 'jsonb', nullable: true })
  boundaries: { lat: number; lng: number }[] | null;

  @Column({ type: 'jsonb', nullable: true })
  centerPoint: { lat: number; lng: number } | null;

  @Column({
    type: 'enum',
    enum: PricingTier,
    default: PricingTier.TIER1,
  })
  pricingTier: PricingTier;

  @Column({ type: 'int', default: 1 })
  estimatedDeliveryDays: number;

  @Column({ type: 'int', array: true, default: [] })
  assignedDrivers: number[];

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
