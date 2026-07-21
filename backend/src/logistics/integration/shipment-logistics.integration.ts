/**
 * BHD Logistics - Shipment-Logistics Integration
 * Connects marketplace orders to logistics operations:
 * auto-creates shipments from orders, links tracking numbers,
 * syncs status updates bidirectionally.
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  Shipment,
  ShipmentStatus,
  Stop,
  OrderLogisticsLink,
} from '../routing/types';
import { GpsTrackingService } from '../tracking/gps-tracking.service';

// ─────────────────────────────────────────────────────────────────────────────
// Mock types for marketplace orders (these would come from the marketplace module)
// ─────────────────────────────────────────────────────────────────────────────

interface MarketplaceOrder {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  shippingAddress: string;
  shippingLat?: number;
  shippingLng?: number;
  pickupAddress?: string;
  pickupLat?: number;
  pickupLng?: number;
  weightKg: number;
  volumeM3?: number;
  priority?: number;
  orderStatus: string;
  createdAt: Date;
  notes?: string;
}

interface OrderUpdatePayload {
  orderId: string;
  trackingNumber?: string;
  status?: string;
  estimatedDelivery?: Date;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class ShipmentLogisticsIntegration {
  private readonly logger = new Logger(ShipmentLogisticsIntegration.name);

  // In-memory storage - replace with database in production
  private shipments: Map<string, Shipment> = new Map();
  private orderLinks: Map<string, OrderLogisticsLink> = new Map(); // orderId -> link
  private trackingCounters: Map<string, number> = new Map(); // prefix -> counter

  constructor(private readonly gpsTrackingService: GpsTrackingService) {}

  // ──────────────────────────────────────────────────────────────────────────
  // Shipment Creation
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Automatically create a shipment when an order is placed.
   * Extracts shipping details from the order and creates a logistics shipment.
   *
   * @param order - The marketplace order
   * @returns Created shipment
   */
  autoCreateShipment(order: MarketplaceOrder): Shipment {
    this.logger.log(`Creating shipment for order ${order.id}`);

    // Generate a tracking number
    const trackingNumber = this.generateTrackingNumber();

    // Create pickup stop (warehouse or seller location)
    const pickupStop: Stop = {
      id: `stop_pickup_${order.id}`,
      order: 1,
      address: order.pickupAddress || 'BHD Logistics Warehouse',
      latitude: order.pickupLat || 40.7128, // Default: NYC (replace with warehouse coords)
      longitude: order.pickupLng || -74.006,
      type: 'pickup',
      orderId: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      weightKg: order.weightKg,
      volumeM3: order.volumeM3,
      notes: order.notes,
      serviceTimeMinutes: 10,
    };

    // Create delivery stop (customer address)
    const deliveryStop: Stop = {
      id: `stop_delivery_${order.id}`,
      order: 2,
      address: order.shippingAddress,
      latitude: order.shippingLat || 40.758, // Geocode if not provided
      longitude: order.shippingLng || -73.9855,
      type: 'delivery',
      orderId: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      weightKg: order.weightKg,
      volumeM3: order.volumeM3,
      notes: order.notes,
      serviceTimeMinutes: 10,
    };

    const shipment: Shipment = {
      id: `shipment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderId: order.id,
      pickupStop,
      deliveryStop,
      weightKg: order.weightKg,
      volumeM3: order.volumeM3 || 0.01,
      priority: order.priority || 5,
      status: 'pending',
      trackingNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.shipments.set(shipment.id, shipment);

    // Link order to shipment
    const link: OrderLogisticsLink = {
      orderId: order.id,
      shipmentId: shipment.id,
      trackingNumber,
      status: 'pending',
      syncedAt: new Date(),
    };
    this.orderLinks.set(order.id, link);

    this.logger.log(
      `Shipment ${shipment.id} created for order ${order.id} with tracking ${trackingNumber}`,
    );

    // Notify that order has been linked to shipment
    this.notifyOrderUpdate({
      orderId: order.id,
      trackingNumber,
      status: 'pending',
      notes: 'Shipment created, awaiting driver assignment',
    });

    return shipment;
  }

  /**
   * Create a shipment manually (not from an order).
   */
  createManualShipment(params: {
    pickupStop: Stop;
    deliveryStop: Stop;
    weightKg: number;
    volumeM3?: number;
    priority?: number;
  }): Shipment {
    const shipment: Shipment = {
      id: `shipment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      pickupStop: params.pickupStop,
      deliveryStop: params.deliveryStop,
      weightKg: params.weightKg,
      volumeM3: params.volumeM3 || 0.01,
      priority: params.priority || 5,
      status: 'pending',
      trackingNumber: this.generateTrackingNumber(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.shipments.set(shipment.id, shipment);
    this.logger.log(`Manual shipment ${shipment.id} created`);

    return shipment;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Order-Shipment Linking
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Update an order with a tracking number.
   */
  updateOrderTracking(orderId: string, trackingNumber: string): OrderLogisticsLink | null {
    const link = this.orderLinks.get(orderId);
    if (!link) {
      this.logger.warn(`No shipment link found for order ${orderId}`);
      return null;
    }

    link.trackingNumber = trackingNumber;
    link.syncedAt = new Date();

    // Update the shipment's tracking number too
    const shipment = this.shipments.get(link.shipmentId);
    if (shipment) {
      shipment.trackingNumber = trackingNumber;
      shipment.updatedAt = new Date();
    }

    this.logger.log(`Order ${orderId} updated with tracking ${trackingNumber}`);

    this.notifyOrderUpdate({
      orderId,
      trackingNumber,
      notes: 'Tracking number assigned',
    });

    return link;
  }

  /**
   * Get the shipment for a given order.
   */
  getOrderShipment(orderId: string): { shipment: Shipment; link: OrderLogisticsLink } | null {
    const link = this.orderLinks.get(orderId);
    if (!link) return null;

    const shipment = this.shipments.get(link.shipmentId);
    if (!shipment) return null;

    return { shipment, link };
  }

  /**
   * Get the order link for a shipment.
   */
  getShipmentOrderLink(shipmentId: string): OrderLogisticsLink | null {
    for (const [, link] of this.orderLinks) {
      if (link.shipmentId === shipmentId) return link;
    }
    return null;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Status Synchronization
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Sync shipment status and propagate to the linked order.
   * This is called when a shipment status changes in the logistics system.
   *
   * @param shipmentId - The shipment ID
   * @returns The updated link or null if not found
   */
  syncShipmentStatus(shipmentId: string): OrderLogisticsLink | null {
    const shipment = this.shipments.get(shipmentId);
    if (!shipment) {
      this.logger.warn(`Shipment ${shipmentId} not found for sync`);
      return null;
    }

    // Find the linked order
    const link = this.getShipmentOrderLink(shipmentId);
    if (!link) {
      this.logger.warn(`No order link found for shipment ${shipmentId}`);
      return null;
    }

    // Map shipment status to order status
    const orderStatus = this.mapShipmentStatusToOrderStatus(shipment.status);

    link.status = shipment.status;
    link.syncedAt = new Date();

    this.logger.log(
      `Synced shipment ${shipmentId} status "${shipment.status}" to order ${link.orderId}`,
    );

    // Notify the order system
    this.notifyOrderUpdate({
      orderId: link.orderId,
      status: orderStatus,
      trackingNumber: link.trackingNumber,
      notes: `Shipment status: ${shipment.status}`,
    });

    return link;
  }

  /**
   * Update shipment status from logistics and sync to order.
   */
  updateShipmentStatus(
    shipmentId: string,
    status: ShipmentStatus,
    metadata?: { driverId?: string; vehicleId?: string; location?: { lat: number; lng: number } },
  ): Shipment | null {
    const shipment = this.shipments.get(shipmentId);
    if (!shipment) return null;

    const oldStatus = shipment.status;
    shipment.status = status;
    shipment.updatedAt = new Date();

    if (metadata?.driverId) {
      shipment.assignedDriverId = metadata.driverId;
    }
    if (metadata?.vehicleId) {
      shipment.assignedVehicleId = metadata.vehicleId;
    }

    this.logger.log(
      `Shipment ${shipmentId} status: ${oldStatus} -> ${status}`,
    );

    // Sync to order
    this.syncShipmentStatus(shipmentId);

    // Start/end GPS tracking based on status
    if (status === 'in_transit' && metadata?.driverId) {
      this.gpsTrackingService
        .startTrip(metadata.driverId, shipmentId)
        .catch((err) => this.logger.error(`Failed to start trip: ${err}`));
    } else if (status === 'delivered' && metadata?.driverId) {
      this.gpsTrackingService
        .endTrip(metadata.driverId, shipmentId)
        .catch((err) => this.logger.error(`Failed to end trip: ${err}`));
    }

    return shipment;
  }

  /**
   * Batch sync all pending shipments.
   */
  async syncAllPendingShipments(): Promise<OrderLogisticsLink[]> {
    const synced: OrderLogisticsLink[] = [];

    for (const [, shipment] of this.shipments) {
      const link = this.syncShipmentStatus(shipment.id);
      if (link) synced.push(link);
    }

    this.logger.log(`Synced ${synced.length} shipments`);
    return synced;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Query Methods
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Get shipment by ID.
   */
  getShipment(shipmentId: string): Shipment | undefined {
    return this.shipments.get(shipmentId);
  }

  /**
   * Get all shipments.
   */
  getAllShipments(): Shipment[] {
    return Array.from(this.shipments.values());
  }

  /**
   * Get shipments by status.
   */
  getShipmentsByStatus(status: ShipmentStatus): Shipment[] {
    return this.getAllShipments().filter((s) => s.status === status);
  }

  /**
   * Get shipments assigned to a driver.
   */
  getDriverShipments(driverId: string): Shipment[] {
    return this.getAllShipments().filter(
      (s) => s.assignedDriverId === driverId,
    );
  }

  /**
   * Get tracking information for an order.
   */
  getOrderTrackingInfo(orderId: string): {
    orderId: string;
    trackingNumber: string;
    status: ShipmentStatus;
    shipmentId: string;
    pickupAddress: string;
    deliveryAddress: string;
    estimatedDelivery?: Date;
    currentLocation?: { lat: number; lng: number };
  } | null {
    const result = this.getOrderShipment(orderId);
    if (!result) return null;

    const { shipment, link } = result;

    return {
      orderId: link.orderId,
      trackingNumber: link.trackingNumber,
      status: shipment.status,
      shipmentId: shipment.id,
      pickupAddress: shipment.pickupStop.address || '',
      deliveryAddress: shipment.deliveryStop.address || '',
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Private Helpers
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Generate a unique tracking number.
   * Format: BHD-YYYYMMDD-XXXXX
   */
  private generateTrackingNumber(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const counter = (this.trackingCounters.get(dateStr) || 0) + 1;
    this.trackingCounters.set(dateStr, counter);

    return `BHD-${dateStr}-${counter.toString().padStart(5, '0')}`;
  }

  /**
   * Map shipment status to order status.
   */
  private mapShipmentStatusToOrderStatus(shipmentStatus: ShipmentStatus): string {
    const mapping: Record<ShipmentStatus, string> = {
      pending: 'processing',
      assigned: 'processing',
      picked_up: 'shipped',
      in_transit: 'shipped',
      out_for_delivery: 'out_for_delivery',
      delivered: 'delivered',
      failed: 'failed',
      cancelled: 'cancelled',
    };

    return mapping[shipmentStatus] || shipmentStatus;
  }

  /**
   * Notify the order system of an update.
   * In production, this would emit an event or call an API.
   */
  private notifyOrderUpdate(payload: OrderUpdatePayload): void {
    // TODO: Integrate with marketplace order service
    // this.eventEmitter.emit('order.logistics_update', payload);
    // or: await this.orderService.updateOrder(payload);

    this.logger.debug(
      `Order update notification: order=${payload.orderId}, status=${payload.status}, tracking=${payload.trackingNumber}`,
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Statistics
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Get integration statistics.
   */
  getStats(): {
    totalShipments: number;
    totalOrderLinks: number;
    byStatus: Record<string, number>;
  } {
    const allShipments = this.getAllShipments();
    const byStatus: Record<string, number> = {};

    for (const status of [
      'pending',
      'assigned',
      'picked_up',
      'in_transit',
      'out_for_delivery',
      'delivered',
      'failed',
      'cancelled',
    ] as ShipmentStatus[]) {
      byStatus[status] = allShipments.filter((s) => s.status === status).length;
    }

    return {
      totalShipments: allShipments.length,
      totalOrderLinks: this.orderLinks.size,
      byStatus,
    };
  }
}
