import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SourceType {
  STORE_ORDER = 'store_order',
  B2B_CUSTOMER = 'b2b_customer',
  INDIVIDUAL = 'individual',
}

export enum ServiceType {
  STANDARD = 'standard',
  EXPRESS = 'express',
  SAME_DAY = 'same_day',
  NEXT_DAY = 'next_day',
}

export enum ShipmentStatus {
  DRAFT = 'draft',
  PENDING_PICKUP = 'pending_pickup',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  AT_HUB = 'at_hub',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED_DELIVERY = 'failed_delivery',
  RETURNED = 'returned',
  CANCELLED = 'cancelled',
}

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30, unique: true })
  @Index()
  trackingNumber: string;

  @Column({ type: 'uuid', nullable: true })
  orderId: string | null;

  @Column({
    type: 'enum',
    enum: SourceType,
    default: SourceType.INDIVIDUAL,
  })
  sourceType: SourceType;

  @Column({ type: 'uuid' })
  senderId: string;

  @Column({ type: 'varchar', length: 100 })
  senderName: string;

  @Column({ type: 'varchar', length: 20 })
  senderPhone: string;

  @Column({ type: 'jsonb' })
  senderAddress: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  senderLocation: { lat: number; lng: number } | null;

  @Column({ type: 'varchar', length: 100 })
  receiverName: string;

  @Column({ type: 'varchar', length: 20 })
  receiverPhone: string;

  @Column({ type: 'jsonb' })
  receiverAddress: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  receiverLocation: { lat: number; lng: number } | null;

  @Column({ type: 'timestamptz', nullable: true })
  pickupDate: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  deliveryDate: Date | null;

  @Column({ type: 'timestamptz' })
  promisedDeliveryDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  weight: number;

  @Column({ type: 'jsonb', nullable: true })
  dimensions: { length: number; width: number; height: number } | null;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  volume: number;

  @Column({ type: 'int', default: 1 })
  pieces: number;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  value: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, nullable: true })
  codAmount: number | null;

  @Column({
    type: 'enum',
    enum: ServiceType,
    default: ServiceType.STANDARD,
  })
  serviceType: ServiceType;

  @Column({
    type: 'enum',
    enum: ShipmentStatus,
    default: ShipmentStatus.DRAFT,
  })
  status: ShipmentStatus;

  @Column({ type: 'uuid', nullable: true })
  driverId: string | null;

  @Column({ type: 'uuid', nullable: true })
  vehicleId: string | null;

  @Column({ type: 'uuid' })
  zoneId: string;

  @Column({ type: 'uuid', nullable: true })
  routeId: string | null;

  @Column({ type: 'uuid', nullable: true })
  pricingRuleId: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  totalCost: number;

  @Column({ type: 'int', default: 0 })
  deliveryAttempts: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  failureReason: string | null;

  @Column({ type: 'jsonb', nullable: true })
  proofOfDelivery: {
    type: string;
    data: string;
    timestamp: Date;
    signature?: string;
    photoUrl?: string;
  } | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  otpCode: string | null;

  @Column({ type: 'boolean', default: false })
  otpVerified: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'text', nullable: true })
  internalNotes: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  signatureUrl: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  deliveryPhotoUrl: string | null;

  @Column({ type: 'jsonb', default: [] })
  timeline: {
    status: string;
    timestamp: Date;
    location?: string;
    notes?: string;
  }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
