/**
 * Order Event Subscriber
 * ======================
 * TypeORM subscriber that automatically creates logistics shipments
 * when marketplace orders are inserted or updated.
 */

import {
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
  Connection,
} from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { OnEvent } from '@nestjs/event-emitter';

import { MarketplaceIntegrationService } from './marketplace-integration.service';
import { ShipmentStatus } from '../enums/logistics.enum';

// ─── Order Entity Interface (minimal for integration) ──────

interface OrderEntity {
  id: string;
  status: string;
  previousStatus?: string;
  trackingNumber?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  shippingLat?: number;
  shippingLng?: number;
  storeAddress?: string;
  storeName?: string;
  storePhone?: string;
  totalAmount: number;
  totalWeightKg?: number;
  paymentStatus: string;
  itemCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Events ─────────────────────────────────────────────────

export class OrderCreatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly order: OrderEntity,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class OrderStatusChangedEvent {
  constructor(
    public readonly orderId: string,
    public readonly oldStatus: string,
    public readonly newStatus: string,
    public readonly order: OrderEntity,
    public readonly timestamp: Date = new Date(),
  ) {}
}

// ─── Subscriber ─────────────────────────────────────────────

@Injectable()
@EventSubscriber()
export class OrderEventSubscriber implements EntitySubscriberInterface<OrderEntity> {
  private readonly logger = new Logger(OrderEventSubscriber.name);

  constructor(
    @InjectConnection() readonly connection: Connection,
    private readonly integrationService: MarketplaceIntegrationService,
  ) {
    // Register this subscriber with TypeORM
    connection.subscribers.push(this);
    this.logger.log('OrderEventSubscriber registered');
  }

  /**
   * Listen to the Order entity (adjust table name as needed)
   */
  listenTo(): any {
    // Return the Order entity class
    // In a real implementation, this would be:
    // return Order;
    // For now, we use string-based filtering in the events
    return Object;
  }

  // ═══════════════════════════════════════════════
  // AFTER INSERT - Auto-create shipment
  // ═══════════════════════════════════════════════

  /**
   * Called after entity insertion.
   * Automatically creates a logistics shipment for new orders.
   */
  async afterInsert(event: InsertEvent<OrderEntity>): Promise<void> {
    const entity = event.entity;

    // Only process marketplace orders (check table name or entity type)
    if (!this.isMarketplaceOrder(entity)) {
      return;
    }

    this.logger.log(`[afterInsert] Order ${entity.id} inserted, auto-creating shipment`);

    try {
      const shipment = await this.integrationService.onOrderCreated(entity.id);
      this.logger.log(
        `[afterInsert] Shipment created: ${shipment.trackingNumber} for order ${entity.id}`,
      );
    } catch (error) {
      this.logger.error(
        `[afterInsert] Failed to create shipment for order ${entity.id}: ${error.message}`,
        error.stack,
      );
      // Don't throw - we don't want to fail the order creation
    }
  }

  // ═══════════════════════════════════════════════
  // AFTER UPDATE - Sync status changes
  // ═══════════════════════════════════════════════

  /**
   * Called after entity update.
   * Syncs order status changes with logistics shipments.
   */
  async afterUpdate(event: UpdateEvent<OrderEntity>): Promise<void> {
    const entity = event.entity as OrderEntity;
    const databaseEntity = event.databaseEntity as OrderEntity;

    if (!entity || !this.isMarketplaceOrder(entity)) {
      return;
    }

    // Check if status changed
    if (entity.status !== databaseEntity?.status) {
      this.logger.log(
        `[afterUpdate] Order ${entity.id} status: ${databaseEntity?.status} -> ${entity.status}`,
      );

      // Emit domain event for other listeners
      // (the actual shipment sync is handled by the event listener below)
    }
  }

  // ═══════════════════════════════════════════════
  // EVENT-BASED LISTENERS (via EventEmitter)
  // ═══════════════════════════════════════════════

  /**
   * Listen for order.created events from the marketplace module
   */
  @OnEvent('order.created', { async: true })
  async handleOrderCreatedEvent(payload: OrderCreatedEvent): Promise<void> {
    this.logger.log(`[handleOrderCreatedEvent] Order ${payload.orderId}`);

    try {
      const shipment = await this.integrationService.onOrderCreated(payload.orderId);
      this.logger.log(
        `[handleOrderCreatedEvent] Shipment ${shipment.trackingNumber} created`,
      );
    } catch (error) {
      this.logger.error(
        `[handleOrderCreatedEvent] Failed: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Listen for order.status_changed events
   */
  @OnEvent('order.status_changed', { async: true })
  async handleOrderStatusChangedEvent(payload: OrderStatusChangedEvent): Promise<void> {
    this.logger.log(
      `[handleOrderStatusChangedEvent] Order ${payload.orderId}: ${payload.oldStatus} -> ${payload.newStatus}`,
    );

    // Map order status to shipment status
    const shipmentStatus = this.mapOrderStatusToShipmentStatus(payload.newStatus);
    if (!shipmentStatus) {
      return; // No mapping needed
    }

    try {
      // Find the shipment for this order
      const shipment = await this.integrationService['shipmentRepo'].findOne({
        where: { orderId: payload.orderId },
      });

      if (shipment && shipment.status !== shipmentStatus) {
        await this.integrationService.onShipmentStatusChanged(
          shipment.id,
          shipmentStatus,
          {
            note: `Order status changed to ${payload.newStatus}`,
          },
        );
        this.logger.log(
          `[handleOrderStatusChangedEvent] Shipment synced to ${shipmentStatus}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `[handleOrderStatusChangedEvent] Failed to sync: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Listen for order.cancelled events
   */
  @OnEvent('order.cancelled', { async: true })
  async handleOrderCancelled(payload: { orderId: string; reason?: string }): Promise<void> {
    this.logger.log(`[handleOrderCancelled] Order ${payload.orderId}`);

    try {
      const shipment = await this.integrationService['shipmentRepo'].findOne({
        where: { orderId: payload.orderId },
      });

      if (shipment && shipment.status !== ShipmentStatus.DELIVERED) {
        await this.integrationService.onShipmentStatusChanged(
          shipment.id,
          ShipmentStatus.CANCELLED,
          { note: `Order cancelled: ${payload.reason ?? 'No reason'}` },
        );
      }
    } catch (error) {
      this.logger.error(
        `[handleOrderCancelled] Failed: ${error.message}`,
        error.stack,
      );
    }
  }

  // ═══════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════

  /**
   * Check if an entity is a marketplace order
   */
  private isMarketplaceOrder(entity: any): boolean {
    // Check for required order fields
    return (
      entity &&
      typeof entity.id === 'string' &&
      typeof entity.status === 'string' &&
      typeof entity.customerName === 'string' &&
      typeof entity.shippingAddress === 'string'
    );
  }

  /**
   * Map order status to shipment status
   */
  private mapOrderStatusToShipmentStatus(orderStatus: string): ShipmentStatus | null {
    const mapping: Record<string, ShipmentStatus> = {
      pending: ShipmentStatus.PENDING,
      processing: ShipmentStatus.CONFIRMED,
      confirmed: ShipmentStatus.CONFIRMED,
      shipped: ShipmentStatus.IN_TRANSIT,
      out_for_delivery: ShipmentStatus.OUT_FOR_DELIVERY,
      delivered: ShipmentStatus.DELIVERED,
      cancelled: ShipmentStatus.CANCELLED,
      refunded: ShipmentStatus.RETURNED,
      on_hold: ShipmentStatus.ON_HOLD,
    };
    return mapping[orderStatus] ?? null;
  }
}
