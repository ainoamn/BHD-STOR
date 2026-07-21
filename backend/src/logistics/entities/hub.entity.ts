import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum HubType {
  CENTRAL = 'central',
  REGIONAL = 'regional',
  LOCAL = 'local',
}

@Entity('hubs')
export class Hub {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  @Index()
  code: string;

  @Column({
    type: 'enum',
    enum: HubType,
    default: HubType.LOCAL,
  })
  type: HubType;

  @Column({ type: 'jsonb' })
  address: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  location: { lat: number; lng: number } | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  managerName: string | null;

  @Column({ type: 'jsonb', nullable: true })
  operatingHours: {
    open: string;
    close: string;
    days: string[];
  } | null;

  @Column({ type: 'int', default: 0 })
  capacity: number;

  @Column({ type: 'int', default: 0 })
  currentLoad: number;

  @Column({ type: 'uuid' })
  zoneId: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
