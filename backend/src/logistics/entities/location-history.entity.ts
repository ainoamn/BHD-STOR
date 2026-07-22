import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm';

@Entity('location_history')
@Index(['shipmentId', 'recordedAt'])
@Index(['entityType', 'entityId', 'recordedAt'])
export class LocationHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  shipmentId: string | null;

  /** Generic polymorphic target (used by marketplace integration) */
  @Column({ type: 'varchar', length: 50, nullable: true })
  entityType: string | null;

  @Column({ type: 'uuid', nullable: true })
  entityId: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lat: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lng: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  speed: number | null;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  heading: number | null;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  recordedAt: Date;
}
