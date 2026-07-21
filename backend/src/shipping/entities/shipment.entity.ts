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
import { Order } from '../../orders/entities/order.entity';
import { ShippingCarrier } from './shipping-carrier.entity';

export enum ShipmentStatus {
  PENDING = 'pending',
  LABEL_CREATED = 'label_created',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETURNED = 'returned',
}

export interface TrackingEvent {
  status: string;
  location: string;
  timestamp: Date;
  description: string;
}

@Entity('shipments')
@Index(['orderId'])
@Index(['carrierId'])
@Index(['status'])
@Index(['trackingNumber'])
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'order_id' })
  orderId: string;

  @Column({ type: 'uuid', name: 'carrier_id' })
  carrierId: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'tracking_number' })
  trackingNumber: string | null;

  @Column({
    type: 'enum',
    enum: ShipmentStatus,
    default: ShipmentStatus.PENDING,
  })
  status: ShipmentStatus;

  @Column({ type: 'varchar', length: 100, name: 'shipping_method' })
  shippingMethod: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'estimated_delivery_date' })
  estimatedDeliveryDate: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'actual_delivery_date' })
  actualDeliveryDate: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  weight: number | null;

  @Column({ type: 'jsonb', nullable: true })
  dimensions: { length: number; width: number; height: number } | null;

  @Column({ type: 'decimal', precision: 10, scale: 3, name: 'shipping_cost' })
  shippingCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true, name: 'insurance_amount' })
  insuranceAmount: number | null;

  @Column({ type: 'boolean', default: false, name: 'signature_required' })
  signatureRequired: boolean;

  @Column({ type: 'jsonb', nullable: true, name: 'tracking_events' })
  trackingEvents: TrackingEvent[] | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'label_url' })
  labelUrl: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  // Relations
  @ManyToOne(() => Order, (order) => order.shipments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Relation<Order>;

  @ManyToOne(() => ShippingCarrier, (carrier) => carrier.shipments, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'carrier_id' })
  carrier: Relation<ShippingCarrier>;

  // Timestamps
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Helper methods
  isDelivered(): boolean {
    return this.status === ShipmentStatus.DELIVERED;
  }

  isInTransit(): boolean {
    return [
      ShipmentStatus.PICKED_UP,
      ShipmentStatus.IN_TRANSIT,
      ShipmentStatus.OUT_FOR_DELIVERY,
    ].includes(this.status);
  }

  canTrack(): boolean {
    return !!this.trackingNumber && this.isInTransit();
  }

  addTrackingEvent(event: TrackingEvent): void {
    if (!this.trackingEvents) {
      this.trackingEvents = [];
    }
    this.trackingEvents.push(event);
  }
}
