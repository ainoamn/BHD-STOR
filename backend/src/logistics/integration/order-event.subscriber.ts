/**
 * Order Event Subscriber
 * ======================
 * EventEmitter listeners that create/sync logistics shipments
 * when marketplace orders are created, paid, updated, or cancelled.
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { MarketplaceIntegrationService } from './marketplace-integration.service';
import { ShipmentStatus } from '../enums/logistics.enum';

export class OrderCreatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly order?: unknown,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class OrderStatusChangedEvent {
  constructor(
    public readonly orderId: string,
    public readonly oldStatus: string,
    public readonly newStatus: string,
    public readonly order?: unknown,
    public readonly timestamp: Date = new Date(),
  ) {}
}

@Injectable()
export class OrderEventSubscriber {
  private readonly logger = new Logger(OrderEventSubscriber.name);

  constructor(private readonly integrationService: MarketplaceIntegrationService) {
    this.logger.log('OrderEventSubscriber (EventEmitter) ready');
  }

  @OnEvent('order.created', { async: true })
  async handleOrderCreatedEvent(payload: {
    orderId: string;
    order?: unknown;
  }): Promise<void> {
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

  @OnEvent('order.paid', { async: true })
  async handleOrderPaidEvent(payload: {
    orderId: string;
    gateway?: string;
  }): Promise<void> {
    this.logger.log(
      `[handleOrderPaidEvent] Order ${payload.orderId} via ${payload.gateway || 'n/a'}`,
    );
    try {
      const shipment = await this.integrationService.onOrderCreated(payload.orderId);
      this.logger.log(
        `[handleOrderPaidEvent] Shipment ${shipment.trackingNumber} ready`,
      );
    } catch (error) {
      this.logger.error(
        `[handleOrderPaidEvent] Failed: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent('order.status_changed', { async: true })
  async handleOrderStatusChangedEvent(payload: {
    orderId: string;
    oldStatus: string;
    newStatus: string;
  }): Promise<void> {
    this.logger.log(
      `[handleOrderStatusChangedEvent] Order ${payload.orderId}: ${payload.oldStatus} -> ${payload.newStatus}`,
    );

    const shipmentStatus = this.mapOrderStatusToShipmentStatus(payload.newStatus);
    if (!shipmentStatus) {
      return;
    }

    try {
      await this.integrationService.syncShipmentStatusFromOrder(
        payload.orderId,
        shipmentStatus,
        `Order status changed to ${payload.newStatus}`,
        { skipOrderCallback: true },
      );
    } catch (error) {
      this.logger.error(
        `[handleOrderStatusChangedEvent] Failed to sync: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent('order.cancelled', { async: true })
  async handleOrderCancelled(payload: {
    orderId: string;
    reason?: string;
  }): Promise<void> {
    this.logger.log(`[handleOrderCancelled] Order ${payload.orderId}`);

    try {
      await this.integrationService.syncShipmentStatusFromOrder(
        payload.orderId,
        ShipmentStatus.CANCELLED,
        `Order cancelled: ${payload.reason ?? 'No reason'}`,
        { skipOrderCallback: true },
      );
    } catch (error) {
      this.logger.error(
        `[handleOrderCancelled] Failed: ${error.message}`,
        error.stack,
      );
    }
  }

  private mapOrderStatusToShipmentStatus(
    orderStatus: string,
  ): ShipmentStatus | null {
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
