/**
 * Shipment Event Emitter
 * ======================
 * Centralized event emitter for the shipment lifecycle.
 * Emits events on status changes that marketplace modules and
 * WebSocket gateways listen to.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WebSocketGateway, WebSocketServer, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { Shipment } from '../entities/shipment.entity';
import { Driver } from '../entities/driver.entity';
import { ShipmentStatus, DriverStatus } from '../enums/logistics.enum';

// ─── Event Types ────────────────────────────────────────────

export interface ShipmentCreatedEvent {
  eventType: 'shipment.created';
  shipmentId: string;
  trackingNumber: string;
  orderId: string | null;
  status: ShipmentStatus;
  timestamp: Date;
}

export interface ShipmentStatusChangedEvent {
  eventType: 'shipment.status_changed';
  shipmentId: string;
  trackingNumber: string;
  orderId: string | null;
  oldStatus: ShipmentStatus;
  newStatus: ShipmentStatus;
  timestamp: Date;
  metadata?: {
    location?: string;
    note?: string;
    driverId?: string;
    driverName?: string;
    lat?: number;
    lng?: number;
  };
}

export interface DriverAssignedEvent {
  eventType: 'driver.assigned';
  shipmentId: string;
  trackingNumber: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  driverRating: number;
  vehiclePlate: string;
  timestamp: Date;
}

export interface DriverLocationUpdateEvent {
  eventType: 'driver.location_updated';
  driverId: string;
  driverName: string;
  shipmentId: string | null;
  lat: number;
  lng: number;
  speed: number | null;
  heading: number | null;
  timestamp: Date;
}

export interface DeliveryCompletedEvent {
  eventType: 'delivery.completed';
  shipmentId: string;
  trackingNumber: string;
  orderId: string | null;
  driverId: string;
  deliveredAt: Date;
  podUrl: string | null;
  signatureUrl: string | null;
  customerName: string;
  timestamp: Date;
}

export interface DeliveryFailedEvent {
  eventType: 'delivery.failed';
  shipmentId: string;
  trackingNumber: string;
  orderId: string | null;
  driverId: string;
  reason: string;
  attemptNumber: number;
  nextAttemptAt: Date | null;
  timestamp: Date;
}

export type ShipmentLifecycleEvent =
  | ShipmentCreatedEvent
  | ShipmentStatusChangedEvent
  | DriverAssignedEvent
  | DriverLocationUpdateEvent
  | DeliveryCompletedEvent
  | DeliveryFailedEvent;

// ─── Event Emitter Service ──────────────────────────────────

@Injectable()
export class ShipmentEventEmitterService {
  private readonly logger = new Logger(ShipmentEventEmitterService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {}

  // ═══════════════════════════════════════════════
  // SHIPMENT LIFECYCLE EVENTS
  // ═══════════════════════════════════════════════

  /**
   * Emit when a new shipment is created
   */
  emitShipmentCreated(shipment: Shipment): void {
    const event: ShipmentCreatedEvent = {
      eventType: 'shipment.created',
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      orderId: shipment.orderId,
      status: shipment.status as ShipmentStatus,
      timestamp: new Date(),
    };

    this.emit('shipment.created', event);
    this.emit('shipment.broadcast', event); // For WebSocket broadcast
  }

  /**
   * Emit when shipment status changes
   */
  emitStatusChanged(
    shipment: Shipment,
    oldStatus: ShipmentStatus,
    metadata?: ShipmentStatusChangedEvent['metadata'],
  ): void {
    const event: ShipmentStatusChangedEvent = {
      eventType: 'shipment.status_changed',
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      orderId: shipment.orderId,
      oldStatus,
      newStatus: shipment.status as ShipmentStatus,
      timestamp: new Date(),
      metadata,
    };

    this.emit('shipment.status_changed', event);
    this.emit('shipment.broadcast', event);

    // Emit specialized events for critical statuses
    if (shipment.status === ShipmentStatus.DELIVERED) {
      this.emitDeliveryCompleted(shipment);
    } else if (shipment.status === ShipmentStatus.FAILED_DELIVERY) {
      this.emitDeliveryFailed(shipment, metadata?.note ?? 'Unknown');
    }
  }

  /**
   * Emit when a driver is assigned to a shipment
   */
  emitDriverAssigned(shipment: Shipment, driver: Driver): void {
    const event: DriverAssignedEvent = {
      eventType: 'driver.assigned',
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      driverId: driver.id,
      driverName: driver.fullName,
      driverPhone: driver.phone,
      driverRating: parseFloat(driver.rating as unknown as string),
      vehiclePlate: driver.assignedVehicle?.plateNumber ?? 'N/A',
      timestamp: new Date(),
    };

    this.emit('driver.assigned', event);
    this.emit('shipment.broadcast', event);
  }

  /**
   * Emit driver location update (for GPS tracking)
   */
  emitDriverLocationUpdate(
    driver: Driver,
    shipmentId: string | null,
    location: { lat: number; lng: number; speed?: number; heading?: number },
  ): void {
    const event: DriverLocationUpdateEvent = {
      eventType: 'driver.location_updated',
      driverId: driver.id,
      driverName: driver.fullName,
      shipmentId,
      lat: location.lat,
      lng: location.lng,
      speed: location.speed ?? null,
      heading: location.heading ?? null,
      timestamp: new Date(),
    };

    this.emit('driver.location_updated', event);
    // Also emit for real-time tracking on specific shipment room
    if (shipmentId) {
      this.emit(`shipment.${shipmentId}.location`, event);
    }
  }

  /**
   * Emit when delivery is completed
   */
  private emitDeliveryCompleted(shipment: Shipment): void {
    const event: DeliveryCompletedEvent = {
      eventType: 'delivery.completed',
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      orderId: shipment.orderId,
      driverId: shipment.assignedDriverId ?? 'unknown',
      deliveredAt: shipment.actualDelivery ?? new Date(),
      podUrl: shipment.deliveryPodUrl,
      signatureUrl: shipment.deliverySignatureUrl,
      customerName: shipment.recipientName,
      timestamp: new Date(),
    };

    this.emit('delivery.completed', event);
    this.emit('shipment.broadcast', event);
  }

  /**
   * Emit when delivery fails
   */
  private emitDeliveryFailed(
    shipment: Shipment,
    reason: string,
    nextAttemptAt?: Date,
  ): void {
    const event: DeliveryFailedEvent = {
      eventType: 'delivery.failed',
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      orderId: shipment.orderId,
      driverId: shipment.assignedDriverId ?? 'unknown',
      reason,
      attemptNumber: shipment.failureAttempts ?? 1,
      nextAttemptAt: nextAttemptAt ?? null,
      timestamp: new Date(),
    };

    this.emit('delivery.failed', event);
    this.emit('shipment.broadcast', event);
  }

  // ═══════════════════════════════════════════════
  // BULK / BATCH EVENTS
  // ═══════════════════════════════════════════════

  /**
   * Emit bulk status update for multiple shipments
   */
  emitBulkStatusUpdate(
    shipmentIds: string[],
    newStatus: ShipmentStatus,
    metadata?: { location?: string; note?: string },
  ): void {
    this.emit('shipment.bulk_status_update', {
      eventType: 'shipment.bulk_status_update',
      shipmentIds,
      newStatus,
      metadata,
      timestamp: new Date(),
    });
  }

  /**
   * Emit route optimization complete event
   */
  emitRouteOptimized(
    routeId: string,
    driverId: string,
    shipmentIds: string[],
    estimatedDistanceKm: number,
    estimatedDurationMin: number,
  ): void {
    this.emit('route.optimized', {
      eventType: 'route.optimized',
      routeId,
      driverId,
      shipmentIds,
      estimatedDistanceKm,
      estimatedDurationMin,
      timestamp: new Date(),
    });
  }

  // ═══════════════════════════════════════════════
  // PRIVATE
  // ═══════════════════════════════════════════════

  private emit(eventName: string, payload: ShipmentLifecycleEvent): void {
    const isAsync = this.configService.get<boolean>('LOGISTICS_EVENT_ASYNC', true);

    if (isAsync) {
      this.eventEmitter.emitAsync(eventName, payload).catch((err) => {
        this.logger.error(`Failed to emit async event ${eventName}: ${err.message}`);
      });
    } else {
      this.eventEmitter.emit(eventName, payload);
    }

    this.logger.debug(`Event emitted: ${eventName} for shipment ${payload.shipmentId ?? 'N/A'}`);
  }
}

// ─── WebSocket Gateway for Real-Time Tracking ───────────────

@WebSocketGateway({
  namespace: '/logistics',
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
})
@Injectable()
export class TrackingWebSocketGateway {
  private readonly logger = new Logger(TrackingWebSocketGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly eventEmitter: EventEmitter2,
    @InjectRepository(Shipment)
    private readonly shipmentRepo: Repository<Shipment>,
  ) {}

  // ── Socket.IO Lifecycle ────────────────────────────

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ── Client Subscriptions ───────────────────────────

  /**
   * Client subscribes to tracking updates for a specific shipment
   */
  @SubscribeMessage('track:shipment')
  async handleTrackShipment(client: Socket, payload: { trackingNumber: string }): Promise<void> {
    const { trackingNumber } = payload;

    // Validate tracking number
    const shipment = await this.shipmentRepo.findOne({
      where: { trackingNumber },
    });

    if (!shipment) {
      client.emit('track:error', { message: 'Tracking number not found' });
      return;
    }

    // Join room for this shipment
    const room = `shipment:${shipment.id}`;
    await client.join(room);

    this.logger.log(`Client ${client.id} joined room ${room}`);

    // Send initial tracking data
    client.emit('track:init', {
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      estimatedDelivery: shipment.estimatedDelivery,
      sender: { name: shipment.senderName, address: shipment.senderAddress },
      recipient: { name: shipment.recipientName, address: shipment.recipientAddress },
    });
  }

  /**
   * Client unsubscribes from a shipment
   */
  @SubscribeMessage('untrack:shipment')
  async handleUntrackShipment(client: Socket, payload: { trackingNumber: string }): Promise<void> {
    const shipment = await this.shipmentRepo.findOne({
      where: { trackingNumber: payload.trackingNumber },
    });
    if (shipment) {
      await client.leave(`shipment:${shipment.id}`);
    }
  }

  /**
   * Client subscribes to driver location updates
   */
  @SubscribeMessage('track:driver')
  async handleTrackDriver(client: Socket, payload: { driverId: string }): Promise<void> {
    const room = `driver:${payload.driverId}`;
    await client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
  }

  // ── Event Listeners (from EventEmitter) ────────────

  /**
   * Listen for shipment broadcast events and forward to WebSocket clients
   */
  @OnEvent('shipment.broadcast')
  handleShipmentBroadcast(event: ShipmentLifecycleEvent): void {
    // Broadcast to shipment-specific room
    const room = `shipment:${event.shipmentId}`;
    this.server.to(room).emit('shipment:update', event);

    // Also broadcast to tracking number room (for public tracking)
    if ('trackingNumber' in event) {
      this.server
        .to(`tracking:${event.trackingNumber}`)
        .emit('tracking:update', event);
    }
  }

  /**
   * Listen for driver location updates and forward to WebSocket clients
   */
  @OnEvent('driver.location_updated')
  handleDriverLocationBroadcast(event: DriverLocationUpdateEvent): void {
    // Send to driver room
    this.server.to(`driver:${event.driverId}`).emit('driver:location', {
      driverId: event.driverId,
      lat: event.lat,
      lng: event.lng,
      speed: event.speed,
      heading: event.heading,
      timestamp: event.timestamp,
    });

    // Send to shipment room if driver is on a delivery
    if (event.shipmentId) {
      this.server.to(`shipment:${event.shipmentId}`).emit('shipment:location', {
        lat: event.lat,
        lng: event.lng,
        speed: event.speed,
        heading: event.heading,
        timestamp: event.timestamp,
      });
    }
  }

  /**
   * Broadcast delivery completion to all connected clients tracking this shipment
   */
  @OnEvent('delivery.completed')
  handleDeliveryCompleted(event: DeliveryCompletedEvent): void {
    const room = `shipment:${event.shipmentId}`;
    this.server.to(room).emit('delivery:completed', {
      trackingNumber: event.trackingNumber,
      deliveredAt: event.deliveredAt,
      podUrl: event.podUrl,
      customerName: event.customerName,
    });
  }

  // ── Utility Methods ────────────────────────────────

  /**
   * Broadcast a message to all connected clients
   */
  broadcast(event: string, data: any): void {
    this.server.emit(event, data);
  }

  /**
   * Send update to a specific shipment's room
   */
  sendToShipment(shipmentId: string, event: string, data: any): void {
    this.server.to(`shipment:${shipmentId}`).emit(event, data);
  }

  /**
   * Send update to a specific driver's room
   */
  sendToDriver(driverId: string, event: string, data: any): void {
    this.server.to(`driver:${driverId}`).emit(event, data);
  }

  /**
   * Get count of connected clients
   */
  getConnectedClients(): number {
    return this.server?.sockets?.sockets?.size ?? 0;
  }
}
