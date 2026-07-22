import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

import { Shipment } from '../entities/shipment.entity';
import { Driver } from '../entities/driver.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { Zone } from '../entities/zone.entity';
import { PricingRule } from '../entities/pricing-rule.entity';
import { Hub } from '../entities/hub.entity';
import { LocationHistory } from '../entities/location-history.entity';
import {
  ShipmentStatus,
  DriverStatus,
  ServiceType,
} from '../enums/logistics.enum';
import { OrdersService } from '../../orders/orders.service';
import { NotificationsService } from '../../notifications/notifications.service';

// ─── DTOs / Interfaces ──────────────────────────────────────

export interface TrackingInfo {
  trackingNumber: string;
  status: ShipmentStatus;
  statusLabelAr: string;
  statusLabelEn: string;
  serviceType: ServiceType;
  estimatedDelivery: Date | null;
  actualDelivery: Date | null;
  sender: { name: string; address: string };
  recipient: { name: string; address: string };
  timeline: TrackingEvent[];
  currentLocation: { lat: number; lng: number } | null;
  driver: { name: string; phone: string; rating: number } | null;
}

export interface TrackingEvent {
  timestamp: Date;
  status: ShipmentStatus;
  labelAr: string;
  labelEn: string;
  location: string;
  note: string | null;
}

export interface ShippingQuoteRequest {
  senderZoneId: string;
  recipientZoneId: string;
  weightKg: number;
  dimensionsCm?: { length: number; width: number; height: number };
  serviceType: ServiceType;
  declaredValue?: number;
  isFragile?: boolean;
  isInsured?: boolean;
}

export interface ShippingQuote {
  serviceType: ServiceType;
  basePrice: number;
  weightCharge: number;
  distanceCharge: number;
  fuelSurcharge: number;
  insuranceCharge: number;
  fragileCharge: number;
  vatAmount: number;
  total: number;
  currency: string;
  estimatedHours: number;
  estimatedDelivery: Date;
  available: boolean;
}

// ─── Service ─────────────────────────────────────────────────

@Injectable()
export class MarketplaceIntegrationService {
  private readonly logger = new Logger(MarketplaceIntegrationService.name);

  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepo: Repository<Shipment>,
    @InjectRepository(Driver)
    private readonly driverRepo: Repository<Driver>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    @InjectRepository(Zone)
    private readonly zoneRepo: Repository<Zone>,
    @InjectRepository(PricingRule)
    private readonly pricingRepo: Repository<PricingRule>,
    @InjectRepository(Hub)
    private readonly hubRepo: Repository<Hub>,
    @InjectRepository(LocationHistory)
    private readonly locationRepo: Repository<LocationHistory>,

    private readonly ordersService: OrdersService,
    private readonly notificationsService: NotificationsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  // ═══════════════════════════════════════════════
  // ORDER CREATION HOOK
  // ═══════════════════════════════════════════════

  /**
   * Called automatically when a marketplace order is created.
   * Creates a corresponding logistics shipment with calculated pricing.
   */
  async onOrderCreated(orderId: string): Promise<Shipment> {
    this.logger.log(`[onOrderCreated] Processing order ${orderId}`);

    const order: any = await this.ordersService.findOne(orderId);
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    const existing = await this.shipmentRepo.findOne({
      where: { orderId },
    });
    if (existing) {
      this.logger.warn(`Shipment already exists for order ${orderId}`);
      return existing;
    }

    const shippingAddress = this.formatAddress(order.shippingAddress);
    const storeAddress = this.formatAddress(
      order.store?.address || order.storeAddress || order.store?.city || 'Muscat, Oman',
    );

    const senderZone = await this.resolveZoneFromAddress(storeAddress);
    let recipientZone = await this.resolveZoneFromAddress(shippingAddress);

    if (!recipientZone) {
      recipientZone =
        (await this.zoneRepo.findOne({ where: { name: 'Muscat' } as any })) ||
        (await this.zoneRepo.findOne({ where: {} }));
    }

    if (!recipientZone) {
      this.logger.warn(
        `[onOrderCreated] No logistics zones configured — creating placeholder shipment for ${orderId}`,
      );
    }

    const totalAmount = Number(order.total ?? order.totalAmount ?? 0);
    const weightKg = Number(order.totalWeightKg ?? 1.0);
    const serviceType = this.selectServiceType({
      ...order,
      isExpress: order.metadata?.shippingMethod === 'express',
      requestSameDay: order.metadata?.shippingMethod === 'sameDay',
    });

    let quote = {
      basePrice: Number(order.shipping ?? 0),
      weightCharge: 0,
      distanceCharge: 0,
      total: Number(order.shipping ?? 1.5),
    };

    if (recipientZone) {
      try {
        quote = await this.calculateShippingQuote({
          senderZoneId: senderZone?.id ?? recipientZone.id,
          recipientZoneId: recipientZone.id,
          weightKg,
          serviceType,
          declaredValue: totalAmount,
          isFragile: order.hasFragileItems ?? false,
          isInsured: totalAmount > 100,
        });
      } catch (err) {
        this.logger.warn(`[onOrderCreated] Quote fallback: ${err.message}`);
      }
    }

    const trackingNumber = await this.generateTrackingNumber();
    const estimatedDelivery = recipientZone
      ? this.estimateDeliveryDate(serviceType, recipientZone)
      : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const addr = order.shippingAddress || {};
    const customerName =
      order.customerName ||
      addr.fullName ||
      `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() ||
      'Customer';
    const customerPhone = order.customerPhone || addr.phone || order.user?.phone || '';

    const isCod =
      order.paymentMethod === 'cod' ||
      order.paymentMethod === 'cash_on_delivery' ||
      order.paymentStatus === 'pending';

    const shipment = this.shipmentRepo.create({
      trackingNumber,
      orderId,
      externalOrderId: order.orderNumber || order.externalOrderId,
      shipmentType: 'b2c',
      serviceType,
      status: ShipmentStatus.CONFIRMED,
      paymentStatus: order.paymentStatus === 'paid' ? 'paid' : isCod ? 'cod' : 'pending',

      senderName: order.store?.name || order.storeName || 'BHD Store',
      senderPhone: order.store?.phone || order.storePhone || '+968 2400 0000',
      senderEmail: order.store?.email || order.storeEmail,
      senderAddress: storeAddress,
      senderZone: senderZone || undefined,

      recipientName: customerName,
      recipientPhone: customerPhone,
      recipientEmail: order.customerEmail || order.user?.email,
      recipientAddress: shippingAddress,
      recipientLat: order.shippingLat ?? addr.latitude ?? null,
      recipientLng: order.shippingLng ?? addr.longitude ?? null,
      recipientZone: recipientZone || undefined,

      description: (order.items || [])
        .map((i: any) => `${i.productName || i.name || 'Item'} x${i.quantity}`)
        .join(', ')
        .slice(0, 500),
      weightKg,
      dimensionsCm: order.dimensionsCm,
      volumeCbM: order.volumeCbM,
      pieces: order.items?.length || order.itemCount || 1,
      declaredValue: totalAmount,
      codAmount: isCod && order.paymentStatus !== 'paid' ? totalAmount : null,
      isFragile: order.hasFragileItems ?? false,
      isInsured: totalAmount > 100,

      shippingCost: quote.basePrice + quote.weightCharge + quote.distanceCharge,
      totalCharge: quote.total,
      currency: order.currency || 'OMR',

      estimatedDelivery,
      currentHub: senderZone ? await this.findNearestHub(senderZone.id) : null,
    });

    const saved = await this.shipmentRepo.save(shipment);
    this.logger.log(`[onOrderCreated] Shipment ${saved.id} created with tracking ${trackingNumber}`);

    await this.ordersService.updateTracking(orderId, trackingNumber);

    this.eventEmitter.emit('shipment.created', {
      shipmentId: saved.id,
      trackingNumber,
      orderId,
      status: saved.status,
    });

    try {
      await this.redis.setex(
        `tracking:${trackingNumber}`,
        86400 * 30,
        JSON.stringify({ shipmentId: saved.id, orderId }),
      );
    } catch {
      // Redis optional for local/dev without cache
    }

    return saved;
  }

  private formatAddress(address: unknown): string {
    if (!address) return '';
    if (typeof address === 'string') return address;
    const a = address as Record<string, unknown>;
    return [a.fullName, a.street, a.building, a.city, a.governorate, a.country]
      .filter(Boolean)
      .join(', ');
  }

  // ═══════════════════════════════════════════════
  // SHIPMENT STATUS SYNC
  // ═══════════════════════════════════════════════

  /**
   * Called when a shipment status changes - syncs back to the marketplace order
   */
  async onShipmentStatusChanged(
    shipmentId: string,
    newStatus: ShipmentStatus,
    metadata?: { location?: string; note?: string; driverId?: string },
  ): Promise<void> {
    this.logger.log(`[onShipmentStatusChanged] Shipment ${shipmentId} -> ${newStatus}`);

    const shipment = await this.shipmentRepo.findOne({
      where: { id: shipmentId },
      relations: ['recipientZone', 'assignedDriver', 'currentHub'],
    });
    if (!shipment) {
      throw new NotFoundException(`Shipment ${shipmentId} not found`);
    }

    const oldStatus = shipment.status;
    shipment.status = newStatus;

    // Update timestamps based on status
    if (newStatus === ShipmentStatus.PICKED_UP) {
      shipment.pickupDate = new Date();
    } else if (newStatus === ShipmentStatus.DELIVERED) {
      shipment.actualDelivery = new Date();
      shipment.deliveryDate = new Date();
    } else if (newStatus === ShipmentStatus.FAILED_DELIVERY) {
      shipment.failureAttempts = (shipment.failureAttempts ?? 0) + 1;
      if (shipment.failureAttempts >= 3) {
        shipment.status = ShipmentStatus.RETURNED;
      }
    }

    await this.shipmentRepo.save(shipment);

    // Sync to marketplace order
    if (shipment.orderId) {
      const orderStatus = this.mapShipmentStatusToOrderStatus(newStatus);
      await this.ordersService.updateStatus(shipment.orderId, orderStatus);

      // Send notification to customer
      await this.sendStatusNotification(shipment, newStatus, oldStatus);
    }

    // Emit event for WebSocket and other listeners
    this.eventEmitter.emit('shipment.status_changed', {
      shipmentId,
      oldStatus,
      newStatus,
      trackingNumber: shipment.trackingNumber,
      orderId: shipment.orderId,
      timestamp: new Date(),
      metadata,
    });

    // Cache update
    await this.invalidateTrackingCache(shipment.trackingNumber);
  }

  // ═══════════════════════════════════════════════
  // TRACKING QUERIES
  // ═══════════════════════════════════════════════

  /**
   * Get tracking info for a marketplace order
   */
  async getOrderTracking(orderId: string): Promise<TrackingInfo> {
    const shipment = await this.shipmentRepo.findOne({
      where: { orderId },
      relations: ['recipientZone', 'senderZone', 'assignedDriver', 'currentHub'],
    });
    if (!shipment) {
      throw new NotFoundException(`No shipment found for order ${orderId}`);
    }

    return this.buildTrackingInfo(shipment);
  }

  /**
   * Public tracking by tracking number (no auth required)
   */
  async getTrackingByNumber(trackingNumber: string): Promise<TrackingInfo> {
    // Try cache first
    const cached = await this.redis.get(`tracking:info:${trackingNumber}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const shipment = await this.shipmentRepo.findOne({
      where: { trackingNumber },
      relations: ['recipientZone', 'senderZone', 'assignedDriver', 'currentHub'],
    });
    if (!shipment) {
      throw new NotFoundException(`Tracking number ${trackingNumber} not found`);
    }

    const info = await this.buildTrackingInfo(shipment);

    // Cache for 5 minutes
    await this.redis.setex(
      `tracking:info:${trackingNumber}`,
      300,
      JSON.stringify(info),
    );

    return info;
  }

  // ═══════════════════════════════════════════════
  // DRIVER AUTO-ASSIGNMENT
  // ═══════════════════════════════════════════════

  /**
   * Auto-assign best available driver to a shipment
   */
  async autoAssignDriver(shipmentId: string): Promise<Driver> {
    const autoAssignEnabled = this.configService.get<boolean>('AUTO_ASSIGN_ENABLED', true);
    if (!autoAssignEnabled) {
      throw new BadRequestException('Auto-assignment is disabled');
    }

    const shipment = await this.shipmentRepo.findOne({
      where: { id: shipmentId },
      relations: ['recipientZone', 'senderZone'],
    });
    if (!shipment) {
      throw new NotFoundException(`Shipment ${shipmentId} not found`);
    }

    if (shipment.assignedDriver) {
      throw new BadRequestException('Shipment already has a driver assigned');
    }

    const zoneId = shipment.recipientZone?.id ?? shipment.senderZone?.id;
    if (!zoneId) {
      throw new BadRequestException('Shipment has no zone assigned');
    }

    // Find available drivers in zone
    const candidateDrivers = await this.findCandidateDrivers(zoneId);
    if (candidateDrivers.length === 0) {
      // Fallback: search in nearby zones
      const fallbackDrivers = await this.findCandidateDrivers(zoneId, true);
      if (fallbackDrivers.length === 0) {
        throw new BadRequestException('No available drivers found');
      }
      candidateDrivers.push(...fallbackDrivers);
    }

    // Score and select best driver
    const bestDriver = await this.scoreAndSelectDriver(candidateDrivers, shipment);

    // Assign driver and vehicle
    shipment.assignedDriver = bestDriver;
    shipment.assignedVehicle = bestDriver.assignedVehicle;
    await this.shipmentRepo.save(shipment);

    // Update driver status
    bestDriver.status = DriverStatus.ON_DELIVERY;
    await this.driverRepo.save(bestDriver);

    // Notify driver
    await this.notificationsService.sendToDriver(bestDriver.id, {
      type: 'NEW_SHIPMENT',
      title: 'طلب توصيل جديد',
      body: `لديك طلب توصيل جديد: ${shipment.trackingNumber}`,
      data: { shipmentId, trackingNumber: shipment.trackingNumber },
    });

    // Emit event
    this.eventEmitter.emit('driver.assigned', {
      shipmentId,
      driverId: bestDriver.id,
      driverName: bestDriver.fullName,
      trackingNumber: shipment.trackingNumber,
    });

    this.logger.log(
      `[autoAssignDriver] Driver ${bestDriver.id} (${bestDriver.fullName}) assigned to shipment ${shipmentId}`,
    );

    return bestDriver;
  }

  // ═══════════════════════════════════════════════
  // SHIPPING QUOTES
  // ═══════════════════════════════════════════════

  /**
   * Calculate shipping quote for a delivery request
   */
  async calculateShippingQuote(req: ShippingQuoteRequest): Promise<ShippingQuote> {
    const pricingRules = await this.pricingRepo.find({
      where: {
        zoneFromId: req.senderZoneId,
        zoneToId: req.recipientZoneId,
        serviceType: req.serviceType,
        isActive: true,
      },
      order: { priority: 'ASC' },
    });

    if (pricingRules.length === 0) {
      // No exact rule - use generic calculation
      return this.calculateGenericQuote(req);
    }

    const rule = pricingRules[0];
    const basePrice = parseFloat(rule.basePrice as unknown as string);
    const pricePerKg = parseFloat(rule.pricePerKg as unknown as string);
    const pricePerKm = parseFloat(rule.pricePerKm as unknown as string);
    const fuelSurchargePct = parseFloat(rule.fuelSurchargePct as unknown as string);
    const vatRate = parseFloat(rule.vatRate as unknown as string);

    const weightInRange =
      (!rule.minWeightKg || req.weightKg >= parseFloat(rule.minWeightKg as unknown as string)) &&
      (!rule.maxWeightKg || req.weightKg <= parseFloat(rule.maxWeightKg as unknown as string));

    if (!weightInRange) {
      return this.calculateGenericQuote(req);
    }

    const weightCharge = req.weightKg * pricePerKg;

    // Get distance
    const zones = await this.zoneRepo.find();
    const zoneDistMap = new Map(zones.map(z => [z.id, z]));
    const fromZone = zoneDistMap.get(req.senderZoneId);
    const toZone = zoneDistMap.get(req.recipientZoneId);
    let distanceKm = 10; // default
    if (fromZone?.centerLat && toZone?.centerLat) {
      distanceKm = this.haversineDistance(
        parseFloat(fromZone.centerLat as unknown as string),
        parseFloat(fromZone.centerLng as unknown as string),
        parseFloat(toZone.centerLat as unknown as string),
        parseFloat(toZone.centerLng as unknown as string),
      );
    }

    const distanceCharge = distanceKm * pricePerKm;
    const subtotal = basePrice + weightCharge + distanceCharge;
    const fuelSurcharge = subtotal * (fuelSurchargePct / 100);

    let insuranceCharge = 0;
    if (req.isInsured && req.declaredValue) {
      insuranceCharge = req.declaredValue * 0.005; // 0.5% of declared value
    }

    let fragileCharge = 0;
    if (req.isFragile) {
      fragileCharge = basePrice * 0.2; // 20% surcharge
    }

    const beforeVat = subtotal + fuelSurcharge + insuranceCharge + fragileCharge;
    const vatAmount = rule.vatIncluded ? 0 : beforeVat * (vatRate / 100);
    const total = beforeVat + vatAmount;

    // Apply min/max
    const finalTotal = rule.minCharge && total < parseFloat(rule.minCharge as unknown as string)
      ? parseFloat(rule.minCharge as unknown as string)
      : rule.maxCharge && total > parseFloat(rule.maxCharge as unknown as string)
        ? parseFloat(rule.maxCharge as unknown as string)
        : total;

    const serviceHours: Record<string, number> = {
      same_day: 6,
      express: 30,
      next_day: 24,
      standard: 60,
      economy: 96,
      cold_chain: 48,
      heavy_cargo: 72,
    };

    return {
      serviceType: req.serviceType,
      basePrice: Math.round(basePrice * 1000) / 1000,
      weightCharge: Math.round(weightCharge * 1000) / 1000,
      distanceCharge: Math.round(distanceCharge * 1000) / 1000,
      fuelSurcharge: Math.round(fuelSurcharge * 1000) / 1000,
      insuranceCharge: Math.round(insuranceCharge * 1000) / 1000,
      fragileCharge: Math.round(fragileCharge * 1000) / 1000,
      vatAmount: Math.round(vatAmount * 1000) / 1000,
      total: Math.round(finalTotal * 1000) / 1000,
      currency: 'OMR',
      estimatedHours: serviceHours[req.serviceType] ?? 60,
      estimatedDelivery: new Date(Date.now() + (serviceHours[req.serviceType] ?? 60) * 3600 * 1000),
      available: true,
    };
  }

  // ═══════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════

  private async generateTrackingNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    // Get sequence from Redis
    const key = `tracking:seq:${year}${month}`;
    const seq = await this.redis.incr(key);
    await this.redis.expire(key, 86400 * 90); // 90 days TTL

    return `BHD${year}${month}${String(seq).padStart(5, '0')}`;
  }

  private async resolveZoneFromAddress(address: string): Promise<Zone | null> {
    if (!address) return null;

    // Try keyword matching first
    const keywords: Record<string, string> = {
      'مسقط|مطرح|القرم|الخوير|السيب|بوشر|العذيبة|روي|غلا|المعبيلة|الغبرة|مدينة السلطان': 'z-muscat-001',
      'صلالة|ظفار|العوقد|حيفة|صحلنوت|الدحيز|رباط': 'z-salalah-001',
      'صحار|شمال الباطنة|السويق|صحم|شناص|لوى': 'z-sohar-001',
      'نزوى|الداخلية|بهلا|الحمراء|أدم|سمائل|إزكي': 'z-nizwa-001',
      'صور|الشرقية|إبراء|المضارب|بدية|وادي بني خالد': 'z-sur-001',
    };

    for (const [pattern, zoneId] of Object.entries(keywords)) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(address)) {
        return this.zoneRepo.findOne({ where: { id: zoneId } });
      }
    }

    // Fallback: match by geocoding if lat/lng available
    return null;
  }

  private selectServiceType(order: any): ServiceType {
    const cutoffHour = this.configService.get<number>('SAME_DAY_CUTOFF_HOUR', 12);
    const currentHour = new Date().getHours();

    if (order.serviceType) return order.serviceType as ServiceType;
    if (order.isExpress) return ServiceType.EXPRESS;
    if (currentHour < cutoffHour && order.requestSameDay) return ServiceType.SAME_DAY;
    return ServiceType.STANDARD;
  }

  private estimateDeliveryDate(serviceType: ServiceType, zone: Zone): Date {
    const hoursMap: Record<string, number> = {
      [ServiceType.SAME_DAY]: 6,
      [ServiceType.EXPRESS]: 30,
      [ServiceType.NEXT_DAY]: 24,
      [ServiceType.STANDARD]: 60,
      [ServiceType.ECONOMY]: 96,
    };

    const hours = hoursMap[serviceType] ?? 60;
    const estimated = new Date(Date.now() + hours * 3600 * 1000);

    // Adjust for zone delivery days
    if (zone.deliveryDays) {
      const days = zone.deliveryDays as number[];
      while (!days.includes(estimated.getDay())) {
        estimated.setDate(estimated.getDate() + 1);
      }
    }

    return estimated;
  }

  private mapShipmentStatusToOrderStatus(shipmentStatus: ShipmentStatus): string {
    const mapping: Record<string, string> = {
      [ShipmentStatus.DRAFT]: 'processing',
      [ShipmentStatus.PENDING]: 'processing',
      [ShipmentStatus.CONFIRMED]: 'processing',
      [ShipmentStatus.PICKED_UP]: 'shipped',
      [ShipmentStatus.IN_TRANSIT]: 'shipped',
      [ShipmentStatus.AT_HUB]: 'shipped',
      [ShipmentStatus.OUT_FOR_DELIVERY]: 'out_for_delivery',
      [ShipmentStatus.DELIVERED]: 'delivered',
      [ShipmentStatus.FAILED_DELIVERY]: 'delivery_failed',
      [ShipmentStatus.RETURNED]: 'returned',
      [ShipmentStatus.CANCELLED]: 'cancelled',
      [ShipmentStatus.ON_HOLD]: 'on_hold',
    };
    return mapping[shipmentStatus] ?? 'processing';
  }

  private async sendStatusNotification(
    shipment: Shipment,
    newStatus: ShipmentStatus,
    oldStatus: ShipmentStatus,
  ): Promise<void> {
    const statusLabels: Record<string, { ar: string; en: string }> = {
      [ShipmentStatus.CONFIRMED]: { ar: 'تم تأكيد طلبك', en: 'Your order is confirmed' },
      [ShipmentStatus.PICKED_UP]: { ar: 'تم استلام طلبك', en: 'Your order has been picked up' },
      [ShipmentStatus.IN_TRANSIT]: { ar: 'طلبك في الطريق', en: 'Your order is in transit' },
      [ShipmentStatus.OUT_FOR_DELIVERY]: { ar: 'طلبك خارج للتوصيل', en: 'Your order is out for delivery' },
      [ShipmentStatus.DELIVERED]: { ar: 'تم توصيل طلبك بنجاح', en: 'Your order has been delivered' },
      [ShipmentStatus.FAILED_DELIVERY]: { ar: 'فشل توصيل طلبك', en: 'Delivery attempt failed' },
    };

    const label = statusLabels[newStatus];
    if (!label) return;

    // Push notification
    await this.notificationsService.sendPush({
      userId: shipment.orderId, // Link to customer
      title: label.ar,
      body: `رقم التتبع: ${shipment.trackingNumber}`,
      data: {
        type: 'SHIPMENT_STATUS',
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber,
        status: newStatus,
        oldStatus,
      },
    });

    // SMS for critical statuses
    if ([ShipmentStatus.OUT_FOR_DELIVERY, ShipmentStatus.DELIVERED].includes(newStatus)) {
      await this.notificationsService.sendSMS({
        phone: shipment.recipientPhone,
        message: `${label.ar}\nرقم التتبع: ${shipment.trackingNumber}\nBHD Logistics`,
      });
    }
  }

  private async buildTrackingInfo(shipment: Shipment): Promise<TrackingInfo> {
    // Build timeline from status history (stored in metadata or separate table)
    const timeline = await this.buildTimeline(shipment);

    // Get current location
    let currentLocation = null;
    if (shipment.assignedDriver?.currentLatitude) {
      currentLocation = {
        lat: parseFloat(shipment.assignedDriver.currentLatitude as unknown as string),
        lng: parseFloat(shipment.assignedDriver.currentLongitude as unknown as string),
      };
    }

    // Get latest location history entry
    if (!currentLocation) {
      const latestLocation = await this.locationRepo.findOne({
        where: { entityType: 'shipment', entityId: shipment.id },
        order: { recordedAt: 'DESC' },
      });
      if (latestLocation) {
        currentLocation = {
          lat: parseFloat(latestLocation.latitude as unknown as string),
          lng: parseFloat(latestLocation.longitude as unknown as string),
        };
      }
    }

    const statusLabels: Record<string, { ar: string; en: string }> = {
      [ShipmentStatus.DRAFT]: { ar: 'مسودة', en: 'Draft' },
      [ShipmentStatus.PENDING]: { ar: 'معلق', en: 'Pending' },
      [ShipmentStatus.CONFIRMED]: { ar: 'مؤكد', en: 'Confirmed' },
      [ShipmentStatus.PICKED_UP]: { ar: 'تم الاستلام', en: 'Picked Up' },
      [ShipmentStatus.IN_TRANSIT]: { ar: 'في الطريق', en: 'In Transit' },
      [ShipmentStatus.AT_HUB]: { ar: 'في المركز', en: 'At Hub' },
      [ShipmentStatus.OUT_FOR_DELIVERY]: { ar: 'خارج للتوصيل', en: 'Out for Delivery' },
      [ShipmentStatus.DELIVERED]: { ar: 'تم التوصيل', en: 'Delivered' },
      [ShipmentStatus.FAILED_DELIVERY]: { ar: 'فشل التوصيل', en: 'Failed' },
      [ShipmentStatus.RETURNED]: { ar: 'مُعاد', en: 'Returned' },
      [ShipmentStatus.CANCELLED]: { ar: 'ملغي', en: 'Cancelled' },
      [ShipmentStatus.ON_HOLD]: { ar: 'في الانتظار', en: 'On Hold' },
    };

    const labels = statusLabels[shipment.status] ?? { ar: shipment.status, en: shipment.status };

    return {
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      statusLabelAr: labels.ar,
      statusLabelEn: labels.en,
      serviceType: shipment.serviceType as ServiceType,
      estimatedDelivery: shipment.estimatedDelivery,
      actualDelivery: shipment.actualDelivery,
      sender: {
        name: shipment.senderName,
        address: shipment.senderAddress,
      },
      recipient: {
        name: shipment.recipientName,
        address: shipment.recipientAddress,
      },
      timeline,
      currentLocation,
      driver: shipment.assignedDriver
        ? {
            name: shipment.assignedDriver.fullName,
            phone: shipment.assignedDriver.phone,
            rating: parseFloat(shipment.assignedDriver.rating as unknown as string),
          }
        : null,
    };
  }

  private async buildTimeline(shipment: Shipment): Promise<TrackingEvent[]> {
    const events: TrackingEvent[] = [];

    // Start with created event
    events.push({
      timestamp: shipment.createdAt,
      status: ShipmentStatus.DRAFT,
      labelAr: 'تم إنشاء الشحنة',
      labelEn: 'Shipment created',
      location: shipment.senderAddress,
      note: null,
    });

    // Build from status history in metadata if available
    if (shipment.metadata?.statusHistory) {
      const history = shipment.metadata.statusHistory as Array<{
        status: string;
        timestamp: string;
        location: string;
        note: string;
      }>;
      for (const h of history) {
        const label = this.getStatusLabel(h.status as ShipmentStatus);
        events.push({
          timestamp: new Date(h.timestamp),
          status: h.status as ShipmentStatus,
          labelAr: label.ar,
          labelEn: label.en,
          location: h.location,
          note: h.note,
        });
      }
    }

    // Add current status if not in history
    const lastEvent = events[events.length - 1];
    if (!lastEvent || lastEvent.status !== shipment.status) {
      const label = this.getStatusLabel(shipment.status);
      events.push({
        timestamp: shipment.updatedAt,
        status: shipment.status,
        labelAr: label.ar,
        labelEn: label.en,
        location: shipment.currentHub?.nameEn ?? shipment.recipientAddress,
        note: null,
      });
    }

    return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private getStatusLabel(status: ShipmentStatus): { ar: string; en: string } {
    const labels: Record<string, { ar: string; en: string }> = {
      [ShipmentStatus.DRAFT]: { ar: 'مسودة', en: 'Draft' },
      [ShipmentStatus.PENDING]: { ar: 'معلق', en: 'Pending' },
      [ShipmentStatus.CONFIRMED]: { ar: 'مؤكد', en: 'Confirmed' },
      [ShipmentStatus.PICKED_UP]: { ar: 'تم الاستلام', en: 'Picked Up' },
      [ShipmentStatus.IN_TRANSIT]: { ar: 'في الطريق', en: 'In Transit' },
      [ShipmentStatus.AT_HUB]: { ar: 'في المركز', en: 'At Hub' },
      [ShipmentStatus.OUT_FOR_DELIVERY]: { ar: 'خارج للتوصيل', en: 'Out for Delivery' },
      [ShipmentStatus.DELIVERED]: { ar: 'تم التوصيل', en: 'Delivered' },
      [ShipmentStatus.FAILED_DELIVERY]: { ar: 'فشل التوصيل', en: 'Failed' },
      [ShipmentStatus.RETURNED]: { ar: 'مُعاد', en: 'Returned' },
      [ShipmentStatus.CANCELLED]: { ar: 'ملغي', en: 'Cancelled' },
      [ShipmentStatus.ON_HOLD]: { ar: 'في الانتظار', en: 'On Hold' },
    };
    return labels[status] ?? { ar: status, en: status };
  }

  private async findCandidateDrivers(
    zoneId: string,
    includeNearby: boolean = false,
  ): Promise<Driver[]> {
    const minRating = this.configService.get<number>('DRIVER_RATING_MIN', 3.0);

    let query = this.driverRepo
      .createQueryBuilder('driver')
      .leftJoinAndSelect('driver.assignedVehicle', 'vehicle')
      .where('driver.status = :status', { status: DriverStatus.ACTIVE })
      .andWhere('driver.rating >= :minRating', { minRating })
      .andWhere('driver.is_active = true');

    if (includeNearby) {
      query = query.andWhere(
        '(driver.preferred_zone_id = :zoneId OR driver.home_hub_id IN (SELECT id FROM hubs WHERE zone_id = :zoneId))',
        { zoneId },
      );
    } else {
      query = query.andWhere('driver.preferred_zone_id = :zoneId', { zoneId });
    }

    return query.getMany();
  }

  private async scoreAndSelectDriver(
    candidates: Driver[],
    shipment: Shipment,
  ): Promise<Driver> {
    const scored = await Promise.all(
      candidates.map(async (driver) => {
        // Get current load (active shipments)
        const activeShipments = await this.shipmentRepo.count({
          where: {
            assignedDriverId: driver.id,
            status: MoreThan(ShipmentStatus.CONFIRMED),
          },
        });

        // Calculate distance to pickup (if we have driver location)
        let distanceScore = 0;
        if (
          driver.currentLatitude &&
          shipment.senderLat
        ) {
          const dist = this.haversineDistance(
            parseFloat(driver.currentLatitude as unknown as string),
            parseFloat(driver.currentLongitude as unknown as string),
            parseFloat(shipment.senderLat as unknown as string),
            parseFloat(shipment.senderLng as unknown as string),
          );
          distanceScore = Math.max(0, 100 - dist); // Closer = higher score
        }

        // Composite score (lower active shipments + higher rating + closer = better)
        const score =
          (5 - Math.min(activeShipments, 5)) * 20 + // Load factor (0-100)
          parseFloat(driver.rating as unknown as string) * 10 + // Rating factor (0-50)
          distanceScore; // Distance factor (0-100)

        return { driver, score };
      }),
    );

    scored.sort((a, b) => b.score - a.score);
    return scored[0].driver;
  }

  private async findNearestHub(zoneId: string): Promise<Hub | null> {
    return this.hubRepo.findOne({
      where: { zoneId },
      order: { capacityDaily: 'DESC' },
    });
  }

  private calculateGenericQuote(req: ShippingQuoteRequest): ShippingQuote {
    const basePrices: Record<string, number> = {
      same_day: 3.5,
      express: 2.5,
      next_day: 2.0,
      standard: 1.5,
      economy: 1.0,
    };

    const basePrice = basePrices[req.serviceType] ?? 1.5;
    const weightCharge = req.weightKg * 0.15;
    const total = basePrice + weightCharge;

    const serviceHours: Record<string, number> = {
      same_day: 6, express: 30, next_day: 24, standard: 60, economy: 96,
    };

    return {
      serviceType: req.serviceType,
      basePrice: Math.round(basePrice * 1000) / 1000,
      weightCharge: Math.round(weightCharge * 1000) / 1000,
      distanceCharge: 0,
      fuelSurcharge: 0,
      insuranceCharge: 0,
      fragileCharge: 0,
      vatAmount: 0,
      total: Math.round(total * 1000) / 1000,
      currency: 'OMR',
      estimatedHours: serviceHours[req.serviceType] ?? 60,
      estimatedDelivery: new Date(Date.now() + (serviceHours[req.serviceType] ?? 60) * 3600 * 1000),
      available: true,
    };
  }

  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  private async invalidateTrackingCache(trackingNumber: string): Promise<void> {
    await this.redis.del(`tracking:info:${trackingNumber}`);
  }
}
